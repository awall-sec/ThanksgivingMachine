import type { DB } from '../types'
import { fmtQty } from './format'

export const STORES = ['Costco', 'HEB', 'Other'] as const

// Default stores (Costco for bulk items, HEB for the rest, Other for pantry staples) (first match wins, so specific terms go first).
const STORE_RULES: [string, string][] = [
  ['brussel', 'HEB'], ['parsley', 'HEB'], ['thyme', 'HEB'], ['celery', 'HEB'], ['carrot', 'HEB'], ['parsnip', 'HEB'],
  ['rosemary', 'HEB'], ['mint', 'HEB'], ['chive', 'HEB'], ['dill', 'HEB'], ['shallot', 'HEB'], ['sweet potato', 'HEB'], ['cranberr', 'HEB'],
  ['ground sage', 'Other'], ['bay leaf', 'Other'], ['cinnamon', 'Other'], ['salt', 'Other'], ['pepper', 'Other'], ['pumpkin pie spice', 'Other'],
  ['pumpkin', 'Other'], ['condensed milk', 'Other'], ['coffee', 'Other'], ['nutmeg', 'Other'], ['ground ginger', 'Other'], ['paprika', 'Other'], ['vanilla', 'Other'],
  ['brown sugar', 'Costco'], ['chicken stock', 'Costco'], ['onion', 'Costco'], ['apple', 'Costco'], ['egg', 'Costco'], ['sour cream', 'Costco'], ['potato', 'Costco'],
  ['green bean', 'Costco'], ["french's", 'Costco'], ['olive oil', 'Costco'], ['lemon', 'Costco'],
  ['turkey', 'HEB'], ['butter', 'HEB'], ['stuffing bread', 'HEB'], ['pecan', 'HEB'], ['cream style corn', 'HEB'], ['jiffy', 'HEB'], ['cream', 'HEB'],
]

export const SECTIONS = ['Meat', 'Vegetables', 'Other'] as const
export type Section = (typeof SECTIONS)[number]

// Pantry forms of meat/produce words (stock, powder, canned, dried...) belong in Other.
const PANTRY = /\b(stock|broth|bouillon|soup|powder|dried|ground|can|cans|canned|jam|jelly|sauce|juice|mix|muffin|fried onion|cream style|puree|pur\u00e9e|condensed|seasoning|extract|syrup|chips?|crackers?|bread|cubes|marshmallow|pie crust|sugar|flour|oil|vinegar|mustard|mayo|spice|peppercorns?|black pepper|white pepper|cayenne|allspice|relish|cider|drippings|cornstarch|starch)/
const MEAT = /\b(turkey|ham|bacon|sausage|chicken|beef|pork|wings?|giblets?|prosciutto|pancetta|chorizo|tamales?|shrimp|salmon|fish)\b/
const VEG = /\b(potato|potatoes|sweet potato|yam|carrot|parsnip|onion|shallot|garlic|celery|green bean|bean|brussel|sprout|pea|peas|corn|mushroom|jalape\u00f1o|jalapeno|pepper|squash|pumpkin|spinach|kale|lettuce|salad|greens|cabbage|broccoli|cauliflower|asparagus|leek|herb|parsley|thyme|rosemary|sage|mint|chive|dill|basil|cilantro|cranberr|lingonberr|apple|lemon|lime|orange|pear|berries|grape|fruit|avocado|tomato|cucumber|zucchini|ginger)/

export function guessSection(name: string): Section {
  const n = name.toLowerCase()
  if (PANTRY.test(n) && !/\bfresh\b/.test(n)) return 'Other'
  if (/^(pepper|pumpkin)$/.test(n.trim())) return 'Other' // ground pepper, canned pumpkin
  if (MEAT.test(n)) return 'Meat'
  if (VEG.test(n)) return 'Vegetables'
  return 'Other'
}

export function guessStore(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('stuffing') && n.includes('sage')) return 'HEB'
  for (const [k, s] of STORE_RULES) if (n.includes(k)) return s
  return 'HEB'
}

const UNIT_ALIASES: Record<string, string> = {
  cups: 'cup', tablespoon: 'tbsp', tablespoons: 'tbsp', teaspoon: 'tsp', teaspoons: 'tsp', lbs: 'lb', pound: 'lb', pounds: 'lb', ounces: 'oz', ounce: 'oz',
  cans: 'can', boxes: 'box', gallons: 'gallon', cloves: 'clove', stalks: 'stalk', sprigs: 'sprig', slices: 'slice', jars: 'jar', packages: 'package', packets: 'packet',
}
const VOLUME_TSP: Record<string, number> = { tsp: 1, tbsp: 3, cup: 48 }
const PLURAL: Record<string, string> = { cup: 'cups', can: 'cans', box: 'boxes', gallon: 'gallons', clove: 'cloves', stalk: 'stalks', sprig: 'sprigs', slice: 'slices', jar: 'jars', package: 'packages', packet: 'packets' }

export function canonUnit(u: string): string {
  const x = u.trim().toLowerCase()
  return UNIT_ALIASES[x] ?? x
}

// Size/prep words that shouldn't split one grocery item into two ("large eggs" = "eggs").
const NOISE = /^(large|medium|small|extra[- ]large|packed|fresh|freshly|chopped|minced|diced|softened|melted|cold|warm|unsalted|salted)\s+/

function baseName(item: string): string {
  let n = item.split(',')[0].replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
  while (NOISE.test(n.toLowerCase())) n = n.replace(/^\S+\s+/, '')
  return n
}

export function itemKey(item: string): string {
  let n = baseName(item).toLowerCase()
  if (/(potato|tomato)es$/.test(n)) n = n.slice(0, -2)
  else if (/[^s]s$/.test(n) && !/(molasses|brussels)$/.test(n)) n = n.slice(0, -1)
  return n
}

function displayName(item: string): string {
  const n = baseName(item)
  return n.charAt(0).toUpperCase() + n.slice(1)
}

export interface GroceryLine {
  key: string
  name: string
  qty: string
  dishes: string[]
  store: string
  section: Section
  checked: boolean
  hidden: boolean
  extraId?: string
}

function fmtVolume(tsp: number): string {
  if (tsp >= 12) return `${fmtQty(Math.round((tsp / 48) * 8) / 8)} cup${tsp / 48 > 1.1 ? 's' : ''}`
  if (tsp >= 3) return `${fmtQty(Math.round((tsp / 3) * 4) / 4)} tbsp`
  return `${fmtQty(tsp)} tsp`
}

export function buildGroceries(db: DB): GroceryLine[] {
  const recipes = new Map(db.recipes.map((r) => [r.id, r]))
  const state = new Map(db.grocery_state.map((s) => [s.item_key, s]))
  const agg = new Map<string, { name: string; units: Map<string, number>; vagueOnly: boolean; dishes: Set<string> }>()
  for (const dish of db.dishes.filter((d) => !d.removed)) {
    const r = dish.chosen_recipe_id ? recipes.get(dish.chosen_recipe_id) : undefined
    if (!r) continue
    const skip = new Set(r.skip_keys ?? [])
    for (const ing of r.ingredients ?? []) {
      const key = itemKey(ing.item)
      if (!key || skip.has(key)) continue
      let a = agg.get(key)
      if (!a) agg.set(key, (a = { name: displayName(ing.item), units: new Map(), vagueOnly: true, dishes: new Set() }))
      a.dishes.add(dish.name)
      if (ing.qty == null) continue
      a.vagueOnly = false
      const u = canonUnit(ing.unit)
      const bucket = VOLUME_TSP[u] ? 'vol' : u
      const amt = VOLUME_TSP[u] ? ing.qty * VOLUME_TSP[u] : ing.qty
      a.units.set(bucket, (a.units.get(bucket) ?? 0) + amt)
    }
  }
  const lines: GroceryLine[] = []
  for (const [key, a] of agg) {
    const parts: string[] = []
    for (const [u, amt] of a.units) {
      if (u === 'vol') {
        // Butter shoppers think in sticks.
        {
          const sticks = Math.ceil((amt / 24) * 2) / 2
          parts.push(key === 'butter' ? `${fmtQty(sticks)} stick${sticks > 1 ? 's' : ''}` : fmtVolume(amt))
        }
      } else if (u === '') parts.push(`${fmtQty(amt)}`)
      else parts.push(`${fmtQty(amt)} ${amt > 1 ? PLURAL[u] ?? u : u}`)
    }
    const s = state.get(key)
    lines.push({
      key,
      name: a.name,
      qty: a.vagueOnly ? 'as needed' : parts.join(' + '),
      dishes: [...a.dishes].sort(),
      store: s?.store ?? guessStore(key),
      section: guessSection(a.name),
      checked: s?.checked ?? false,
      hidden: s?.hidden ?? false,
    })
  }
  for (const x of db.grocery_extras) {
    lines.push({ key: `extra:${x.id}`, name: x.name, qty: x.qty ?? '', dishes: [], store: x.store, section: guessSection(x.name), checked: x.checked, hidden: false, extraId: x.id })
  }
  return lines.sort((a, b) => a.name.localeCompare(b.name))
}
