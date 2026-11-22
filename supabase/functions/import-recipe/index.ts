// Fetches a recipe page and extracts its schema.org/Recipe JSON-LD.
// Returns only the parsed recipe fields (never the raw page), so it can't be used as a general proxy.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const MAX_BYTES = 4_000_000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return h.includes(':')
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', frac12: '½', frac14: '¼', frac34: '¾', deg: '°', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…' }
function clean(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

function minutes(iso: unknown): number | null {
  if (typeof iso !== 'string') return null
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i)
  if (!m || !m[0] || m[0] === 'P' || m[0] === 'PT') return null
  const v = (Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0)
  return v > 0 ? v : null
}

function isRecipe(o: any): boolean {
  const t = o?.['@type']
  return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))
}

function findRecipe(node: any, depth = 0): any {
  if (!node || typeof node !== 'object' || depth > 6) return null
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n, depth + 1)
      if (r) return r
    }
    return null
  }
  if (isRecipe(node)) return node
  for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement']) {
    const r = findRecipe(node[k], depth + 1)
    if (r) return r
  }
  return null
}

function steps(ins: any): string[] {
  if (!ins) return []
  if (typeof ins === 'string') return ins.split(/\n+|(?<=\.)\s+(?=[A-Z])/).map(clean).filter(Boolean)
  if (Array.isArray(ins)) return ins.flatMap(steps)
  if (typeof ins === 'object') {
    if (ins.itemListElement) {
      const inner = steps(ins.itemListElement)
      return ins['@type'] === 'HowToSection' && ins.name ? [`— ${clean(ins.name)} —`, ...inner] : inner
    }
    const t = clean(ins.text ?? ins.name)
    return t ? [t] : []
  }
  return []
}

function yieldText(y: any): string {
  if (Array.isArray(y)) return clean(String(y.find((x) => /\D/.test(String(x))) ?? y[0] ?? ''))
  return y == null ? '' : clean(String(y))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)
  let url: URL
  try {
    const body = await req.json()
    url = new URL(String(body?.url ?? '').trim())
  } catch {
    return json({ error: "That doesn't look like a web link." }, 400)
  }
  if (!['http:', 'https:'].includes(url.protocol) || isBlockedHost(url.hostname)) {
    return json({ error: 'Only public http(s) recipe links are supported.' }, 400)
  }

  let html: string
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: {
        // Honest client name. Sites that block automated readers get the paste-text fallback in the app.
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeImporter/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) {
      const why = res.status === 404 || res.status === 410
        ? "That page wasn't found — double-check the link."
        : [401, 403, 429].includes(res.status)
          ? 'That site blocks automatic imports — paste the recipe text instead.'
          : `The site answered ${res.status} — paste the recipe text instead.`
      return json({ error: why }, 502)
    }
    const buf = new Uint8Array(await res.arrayBuffer())
    html = new TextDecoder().decode(buf.slice(0, MAX_BYTES))
  } catch {
    return json({ error: "Couldn't reach that page. Check the link, or add the recipe by hand." }, 502)
  }

  let recipe: any = null
  for (const m of html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      recipe = findRecipe(JSON.parse(m[1].trim()))
    } catch {
      /* some sites ship invalid JSON-LD; skip it */
    }
    if (recipe) break
  }
  if (!recipe) return json({ error: "Couldn't find a recipe card on that page. You can still add it by hand." }, 422)

  const prep = minutes(recipe.prepTime)
  const cook = minutes(recipe.cookTime)
  const total = minutes(recipe.totalTime)
  return json({
    title: clean(recipe.name) || clean(html.match(/<title>([^<]*)<\/title>/i)?.[1]),
    description: clean(recipe.description).slice(0, 300),
    serves: yieldText(recipe.recipeYield),
    prep_min: prep,
    cook_min: cook ?? (total && prep ? Math.max(0, total - prep) : total),
    ingredients: (Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : recipe.ingredients ?? []).map(clean).filter(Boolean),
    steps: steps(recipe.recipeInstructions),
    source_url: url.toString(),
  })
})
