import { useMemo, useState } from 'react'
import { useDB } from '../lib/db'
import { EQ } from '../lib/schedule'
import { canonUnit, guessStore, itemKey } from '../lib/grocery'
import { fmtMinutes, fmtQty } from '../lib/format'
import type { Dish, Eq, Ingredient, Recipe } from '../types'
import { confetti } from './confetti'
import { buildTasks, guessEquipment, importFromLink, parseRecipeText } from '../lib/importRecipe'

const CATEGORIES: [string, string][] = [['main', '🦃 Mains'], ['prep', '🧂 Prep Work'], ['side', '🥔 Sides'], ['dessert', '🥧 Desserts']]

export function fmtIngredient(i: Ingredient): string {
  return [i.qty != null ? fmtQty(i.qty) : '', i.unit, i.item].filter(Boolean).join(' ')
}

const UNIT_WORDS = new Set(['cup', 'cups', 'c', 'tbsp', 'tbs', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'lb', 'lbs', 'oz', 'ounce', 'ounces', 'can', 'cans', 'box', 'boxes', 'gallon', 'gallons', 'quart', 'quarts', 'pint', 'pints', 'clove', 'cloves', 'stalk', 'stalks', 'sprig', 'sprigs', 'slice', 'slices', 'jar', 'jars', 'package', 'packages', 'packet', 'packets', 'pound', 'pounds', 'stick', 'sticks', 'bunch', 'bunches', 'bag', 'bags', 'pinch', 'dash', 'g', 'kg', 'ml', 'l'])
const UNICODE_FRAC: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67, '⅛': 0.125 }

function parseQty(s: string): number | null {
  let total = 0
  let any = false
  for (const part of s.trim().split(/\s+/)) {
    if (UNICODE_FRAC[part] != null) total += UNICODE_FRAC[part]
    else if (/^\d+\/\d+$/.test(part)) {
      const [a, b] = part.split('/').map(Number)
      total += a / b
    } else if (/^\d*\.?\d+$/.test(part)) total += Number(part)
    else return null
    any = true
  }
  return any ? Math.round(total * 1000) / 1000 : null
}

export function parseIngredient(line: string): Ingredient {
  const m = line.trim().match(/^([\d\s/.½¼¾⅓⅔⅛]+)?\s*(.*)$/)
  const qty = m?.[1] ? parseQty(m[1]) : null
  let rest = (m?.[2] ?? line).trim()
  let unit = ''
  const first = rest.split(/\s+/)[0]?.toLowerCase() ?? ''
  if (UNIT_WORDS.has(first)) {
    unit = canonUnit(first)
    rest = rest.slice(first.length).trim()
  }
  return { qty, unit, item: rest }
}

function EditModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { upsert } = useDB()
  const [title, setTitle] = useState(recipe.title)
  const [description, setDescription] = useState(recipe.description ?? '')
  const [serves, setServes] = useState(recipe.serves ?? '')
  const [ing, setIng] = useState(recipe.ingredients.map(fmtIngredient).join('\n'))
  const [steps, setSteps] = useState(recipe.steps.join('\n'))
  const save = () => {
    upsert('recipes', {
      id: recipe.id,
      title: title.trim() || recipe.title,
      description: description.trim() || null,
      serves: serves.trim() || null,
      ingredients: ing.split('\n').map((l) => l.trim()).filter(Boolean).map(parseIngredient),
      steps: steps.split('\n').map((l) => l.trim()).filter(Boolean),
    })
    onClose()
  }
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Edit recipe">
        <h2>✏️ Edit recipe</h2>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Description<input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <label>Serves<input value={serves} onChange={(e) => setServes(e.target.value)} /></label>
        <label>
          Ingredients <small>(one per line, like “1 1/2 cup turkey stock” — these build the grocery list)</small>
          <textarea rows={8} value={ing} onChange={(e) => setIng(e.target.value)} />
        </label>
        <label>
          Steps <small>(one per line)</small>
          <textarea rows={7} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>
        <p className="muted small">Cooking times on the dashboard can be nudged ±15 min right from the schedule.</p>
        <div className="row end">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}

type OnPicked = (recipe: Recipe, initial: Set<string>) => void

/** Unique grocery items in a recipe, keyed the same way the grocery list merges them. */
function recipeItems(recipe: Pick<Recipe, 'ingredients'>) {
  const seen = new Map<string, { key: string; label: string; store: string }>()
  for (const i of recipe.ingredients ?? []) {
    const key = itemKey(i.item)
    if (key && !seen.has(key)) seen.set(key, { key, label: fmtIngredient(i), store: guessStore(key) })
  }
  return [...seen.values()]
}

function NeedPopup({ recipe, dish, initial, onClose }: { recipe: Recipe; dish: Dish; initial: Set<string>; onClose: () => void }) {
  const { db, upsert } = useDB()
  const items = useMemo(() => recipeItems(recipe), [recipe])
  const [need, setNeed] = useState<Set<string>>(() => new Set(initial))
  const toggle = (k: string) =>
    setNeed((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  const save = () => {
    upsert('recipes', { id: recipe.id, skip_keys: items.filter((i) => !need.has(i.key)).map((i) => i.key) })
    // Anything we need that was X'd off the list earlier comes back.
    for (const k of need) {
      const st = db.grocery_state.find((g) => g.item_key === k)
      if (st?.hidden) upsert('grocery_state', { item_key: k, hidden: false, updated_at: new Date().toISOString() })
    }
    onClose()
  }
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Choose groceries">
        <h2>🛒 What do you need to buy?</h2>
        <p className="muted">
          For <b>{recipe.title}</b> ({dish.name}). Check only the things you <b>don&apos;t already have</b> — those go on the grocery list.
        </p>
        <div className="row">
          <button className="chip-btn" onClick={() => setNeed(new Set(items.map((i) => i.key)))}>Check all</button>
          <button className="chip-btn" onClick={() => setNeed(new Set())}>Clear</button>
          <span className="muted small">{need.size} of {items.length} to buy</span>
        </div>
        <ul className="need-list">
          {items.map((i) => (
            <li key={i.key} className={need.has(i.key) ? 'on' : ''} onClick={() => toggle(i.key)}>
              <button
                className="check"
                aria-label={(need.has(i.key) ? 'Do not buy ' : 'Buy ') + i.label}
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(i.key)
                }}
              >
                {need.has(i.key) ? '✓' : ''}
              </button>
              <span className="need-label">{i.label}</span>
              <span className="chip">{i.store}</span>
            </li>
          ))}
          {!items.length && <li className="muted">This recipe has no ingredients listed.</li>}
        </ul>
        <div className="row end">
          <button className="btn ghost" onClick={onClose}>Not now</button>
          <button className="btn primary" onClick={save}>{need.size ? `Add ${need.size} to grocery list` : 'I have everything'}</button>
        </div>
      </div>
    </div>
  )
}

const EQ_CHOICES: Eq[] = ['oven', 'stove', 'fryer', 'microwave', 'counter', 'fridge']

function AddRecipeModal({ dish, nextSort, onClose, onPicked }: { dish: Dish; nextSort: number; onClose: () => void; onPicked: OnPicked }) {
  const { upsert } = useDB()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null)
  const [showPaste, setShowPaste] = useState(false)
  const [paste, setPaste] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [serves, setServes] = useState('')
  const [prep, setPrep] = useState('15')
  const [cook, setCook] = useState('30')
  const [eq, setEq] = useState<Eq>('oven')
  const [temp, setTemp] = useState('350')
  const [when, setWhen] = useState<'day' | 'before'>(dish.category === 'dessert' ? 'before' : 'day')
  const [ing, setIng] = useState('')
  const [steps, setSteps] = useState('')
  const [pickIt, setPickIt] = useState(true)

  const fillFrom = (ingredients: string[], stepList: string[]) => {
    if (ingredients.length) setIng(ingredients.join('\n'))
    if (stepList.length) {
      setSteps(stepList.join('\n'))
      const g = guessEquipment(stepList)
      setEq(g.eq)
      if (g.temp) setTemp(String(g.temp))
    }
  }

  const doImport = async () => {
    if (!url.trim()) return
    setBusy(true)
    setMsg(null)
    try {
      const r = await importFromLink(url.trim())
      setTitle(r.title || title)
      setDescription(r.description || '')
      setServes(r.serves || '')
      if (r.prep_min != null) setPrep(String(r.prep_min))
      if (r.cook_min != null) setCook(String(r.cook_min))
      fillFrom(r.ingredients, r.steps)
      setMsg({ kind: 'ok', text: `Imported ${r.ingredients.length} ingredients and ${r.steps.length} steps. Check the timing below, then save.` })
    } catch (e) {
      setMsg({ kind: 'bad', text: (e as Error).message })
      setShowPaste(true)
    } finally {
      setBusy(false)
    }
  }

  const doPaste = () => {
    const r = parseRecipeText(paste)
    if (r.title && !title) setTitle(r.title)
    fillFrom(r.ingredients, r.steps)
    setMsg({ kind: r.ingredients.length || r.steps.length ? 'ok' : 'bad', text: r.ingredients.length || r.steps.length ? `Found ${r.ingredients.length} ingredients and ${r.steps.length} steps. Tidy up below if needed.` : "Couldn't spot ingredients or steps — type them below." })
  }

  const save = () => {
    const prepN = Math.max(0, Math.round(Number(prep) || 0))
    const cookN = Math.max(0, Math.round(Number(cook) || 0))
    const tempN = eq === 'oven' ? Number(temp) || null : null
    const id = `${dish.id}-own-${Date.now().toString(36)}`
    const stepList = steps.split('\n').map((l) => l.trim()).filter(Boolean)
    const ingredients = ing.split('\n').map((l) => l.trim()).filter(Boolean).map(parseIngredient)
    // Nothing goes on the grocery list until the family says what they need.
    const skip_keys = pickIt ? recipeItems({ ingredients }).map((i) => i.key) : []
    const recipe: Recipe = {
      id,
      dish_id: dish.id,
      title: title.trim() || `Our ${dish.name}`,
      badge: url.trim() ? 'From a link' : 'Family added',
      description: description.trim() || null,
      serves: serves.trim() || null,
      prep_min: prepN,
      cook_min: cookN,
      equipment: eq,
      temp_f: tempN,
      ingredients,
      steps: stepList,
      tasks: buildTasks(dish.name, prepN, cookN, eq, tempN, when),
      sort: nextSort,
      source_url: url.trim() || null,
      skip_keys,
    }
    upsert('recipes', recipe)
    onClose()
    if (pickIt) {
      upsert('dishes', { id: dish.id, chosen_recipe_id: id })
      confetti(24)
      onPicked(recipe, new Set())
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Add a recipe for ${dish.name}`}>
        <h2>🔗 Add a recipe for {dish.name}</h2>
        <label>
          Recipe link
          <div className="row">
            <input style={{ flex: 1 }} type="url" placeholder="https://… paste the recipe page link" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doImport()} />
            <button className="btn primary" onClick={doImport} disabled={busy || !url.trim()}>{busy ? 'Reading…' : 'Import'}</button>
          </div>
        </label>
        {msg && <div className={`notice ${msg.kind === 'bad' ? 'bad' : ''}`}>{msg.kind === 'ok' ? '✅' : '😬'} {msg.text}</div>}
        {!showPaste ? (
          <button className="link" onClick={() => setShowPaste(true)}>Site won't import? Paste the recipe text instead →</button>
        ) : (
          <label>
            Paste the recipe text <small>(copy the ingredients and directions from the page — the link above is kept for "View original")</small>
            <textarea rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'Ingredients\n2 lb green beans\n...\nInstructions\n1. Preheat oven to 350°F...'} />
            <div className="row"><button className="btn" onClick={doPaste} disabled={!paste.trim()}>Fill in from text</button></div>
          </label>
        )}
        <hr className="divider" />
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Our ${dish.name}`} /></label>
        <div className="form-grid">
          <label>Serves<input value={serves} onChange={(e) => setServes(e.target.value)} placeholder="8" /></label>
          <label>Prep (min)<input type="number" min="0" value={prep} onChange={(e) => setPrep(e.target.value)} /></label>
          <label>Cook (min)<input type="number" min="0" value={cook} onChange={(e) => setCook(e.target.value)} /></label>
          <label>Cooks in
            <select value={eq} onChange={(e) => setEq(e.target.value as Eq)}>
              {EQ_CHOICES.map((x) => <option key={x} value={x}>{EQ[x].emoji} {EQ[x].label}</option>)}
            </select>
          </label>
          {eq === 'oven' && <label>Oven °F<input type="number" min="150" max="550" value={temp} onChange={(e) => setTemp(e.target.value)} /></label>}
          <label>When
            <select value={when} onChange={(e) => setWhen(e.target.value as 'day' | 'before')}>
              <option value="day">Thursday — ready at dinner</option>
              <option value="before">Wednesday — make ahead</option>
            </select>
          </label>
        </div>
        <label>Ingredients <small>(one per line — these feed the grocery list)</small><textarea rows={7} value={ing} onChange={(e) => setIng(e.target.value)} /></label>
        <label>Steps <small>(one per line)</small><textarea rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} /></label>
        <label className="toggle"><input type="checkbox" checked={pickIt} onChange={(e) => setPickIt(e.target.checked)} /> Make this our pick for {dish.name}</label>
        <div className="row end">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>Save recipe</button>
        </div>
      </div>
    </div>
  )
}

function OptionCard({ recipe, dish, picked, onPicked }: { recipe: Recipe; dish: Dish; picked: boolean; onPicked: OnPicked }) {
  const { upsert, remove } = useDB()
  const [editing, setEditing] = useState(false)
  const added = recipe.id.includes('-own-')
  const del = () => {
    if (!window.confirm(`Remove "${recipe.title}" from ${dish.name}?`)) return
    if (picked) upsert('dishes', { id: dish.id, chosen_recipe_id: null })
    remove('recipes', recipe.id)
  }
  const eq = recipe.equipment ? EQ[recipe.equipment] : null
  const allKeys = () => recipeItems(recipe).map((i) => i.key)
  const pick = () => {
    upsert('dishes', { id: dish.id, chosen_recipe_id: picked ? null : recipe.id })
    if (picked) return
    confetti(24)
    // Start from what they said last time; otherwise nothing is on the list until they choose.
    const prevSkip = recipe.skip_keys ?? []
    const initial = prevSkip.length ? new Set(allKeys().filter((k) => !prevSkip.includes(k))) : new Set<string>()
    if (!prevSkip.length) upsert('recipes', { id: recipe.id, skip_keys: allKeys() })
    onPicked(recipe, initial)
  }
  const review = () => {
    const skip = recipe.skip_keys ?? []
    onPicked(recipe, new Set(allKeys().filter((k) => !skip.includes(k))))
  }
  return (
    <div className={`option card ${picked ? 'picked' : ''}`}>
      {picked && <div className="ribbon">Our pick!</div>}
      <div className="option-top">
        {recipe.badge && <span className={`badge ${recipe.badge.startsWith('Family') ? 'family' : ''}`}>{recipe.badge.startsWith('Family') ? '❤️ ' : ''}{recipe.badge}</span>}
        <h4>{recipe.title}</h4>
        {recipe.description && <p className="muted">{recipe.description}</p>}
        <div className="chips">
          {recipe.serves && <span className="chip">🍽️ {recipe.serves}</span>}
          {recipe.prep_min != null && <span className="chip">🔪 {fmtMinutes(recipe.prep_min)}</span>}
          {!!recipe.cook_min && <span className="chip">⏱️ {fmtMinutes(recipe.cook_min)}</span>}
          {eq && <span className="chip">{eq.emoji} {eq.label}{recipe.temp_f ? ` ${recipe.temp_f}°` : ''}</span>}
        </div>
      </div>
      <details>
        <summary>Ingredients ({recipe.ingredients.length})</summary>
        <ul className="ing">{recipe.ingredients.map((i, k) => <li key={k}>{fmtIngredient(i)}</li>)}</ul>
      </details>
      <details>
        <summary>Steps ({recipe.steps.length})</summary>
        <ol className="steps">{recipe.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
      </details>
      {recipe.tasks.length > 0 && (
        <details>
          <summary>Schedule ({recipe.tasks.length} steps)</summary>
          <ul className="ing">
            {recipe.tasks.map((t) => (
              <li key={t.id}>{EQ[t.eq].emoji} {t.label} <span className="muted">· {fmtMinutes(t.dur)}{t.temp ? ` · ${t.temp}°` : ''}</span></li>
            ))}
          </ul>
        </details>
      )}
      <div className="row option-actions">
        <button className={`btn ${picked ? 'good' : 'primary'}`} onClick={pick}>{picked ? '✓ Picked (tap to undo)' : 'Pick this one'}</button>
        <button className="btn ghost" onClick={() => setEditing(true)}>✏️ Edit</button>
        {picked && <button className="btn ghost" onClick={review} title="Choose which ingredients to buy" aria-label="Choose which ingredients to buy">🛒</button>}
        {added && <button className="btn ghost" onClick={del} aria-label={`Remove ${recipe.title}`}>🗑</button>}
      </div>
      {recipe.source_url && <a className="source-link" href={recipe.source_url} target="_blank" rel="noopener noreferrer">🔗 View original recipe</a>}
      {editing && <EditModal recipe={recipe} onClose={() => setEditing(false)} />}
    </div>
  )
}

function DishCard({ dish, options }: { dish: Dish; options: Recipe[] }) {
  const { upsert } = useDB()
  const [need, setNeed] = useState<{ recipe: Recipe; initial: Set<string> } | null>(null)
  const onPicked: OnPicked = (recipe, initial) => setNeed({ recipe, initial })
  const removeDish = () => {
    if (window.confirm(`Take ${dish.name} off the menu? Its steps and groceries disappear. You can bring it back from "Removed dishes" at the bottom.`)) {
      upsert('dishes', { id: dish.id, removed: true })
    }
  }
  const chosen = options.find((r) => r.id === dish.chosen_recipe_id)
  const [open, setOpen] = useState(!chosen && options.length > 0)
  const [adding, setAdding] = useState(false)
  const [who, setWho] = useState(dish.who ?? '')
  return (
    <section className={`dish card ${chosen ? 'has-pick' : options.length ? 'needs-pick' : ''}`}>
      <header className="dish-head" onClick={() => setOpen(!open)}>
        <div>
          <h3>{dish.name}</h3>
          <div className="dish-sub">
            {chosen ? <span className="pill good">✓ {chosen.title}</span> : options.length ? <span className="pill warn">Pick 1 of {options.length}</span> : <span className="pill">{dish.notes ?? 'No recipe'}</span>}
          </div>
        </div>
        <label className="who" onClick={(e) => e.stopPropagation()}>
          <span>👩‍🍳</span>
          <input
            value={who}
            placeholder="Who's cooking?"
            onChange={(e) => setWho(e.target.value)}
            onBlur={() => who !== (dish.who ?? '') && upsert('dishes', { id: dish.id, who: who.trim() || null })}
            aria-label={`Cook for ${dish.name}`}
          />
        </label>
        <span className={`chev ${open ? 'open' : ''}`}>▾</span>
        <button
          className="x dish-x"
          onClick={(e) => {
            e.stopPropagation()
            removeDish()
          }}
          aria-label={`Remove ${dish.name} from the menu`}
          title="Remove from menu"
        >
          ✕
        </button>
      </header>
      {open && (
        <div className="options">
          {options.map((r) => <OptionCard key={r.id} recipe={r} dish={dish} picked={r.id === dish.chosen_recipe_id} onPicked={onPicked} />)}
          <button className="add-recipe card" onClick={() => setAdding(true)}>
            <span className="add-plus">＋</span>
            <b>Add a recipe</b>
            <span className="muted small">Paste a link or the recipe text</span>
          </button>
        </div>
      )}
      {adding && <AddRecipeModal dish={dish} nextSort={Math.max(0, ...options.map((o) => o.sort)) + 1} onClose={() => setAdding(false)} onPicked={onPicked} />}
      {need && <NeedPopup recipe={need.recipe} dish={dish} initial={need.initial} onClose={() => setNeed(null)} />}
    </section>
  )
}

export function Recipes() {
  const { db } = useDB()
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')
  const byDish = useMemo(() => {
    const m = new Map<string, Recipe[]>()
    for (const r of [...db.recipes].sort((a, b) => a.sort - b.sort)) m.set(r.dish_id, [...(m.get(r.dish_id) ?? []), r])
    return m
  }, [db.recipes])
  const { upsert } = useDB()
  const active = db.dishes.filter((d) => !d.removed)
  const removedDishes = db.dishes.filter((d) => d.removed).sort((a, b) => a.sort - b.sort)
  const pickable = active.filter((d) => byDish.has(d.id))
  const picked = pickable.filter((d) => d.chosen_recipe_id).length
  const dishes = [...active].sort((a, b) => a.sort - b.sort).filter((d) =>
    filter === 'all' ? true : filter === 'todo' ? byDish.has(d.id) && !d.chosen_recipe_id : !!d.chosen_recipe_id,
  )
  return (
    <div className="page">
      <div className="card hero-mini">
        <div>
          <h2>📖 Recipes</h2>
          <p className="muted">Each dish has 3 options — ❤️ marks the family recipe from the sheet. Picks build the schedule and the grocery list.</p>
        </div>
        <div className="progress-wrap">
          <div className="progress-label"><b>{picked}</b> of {pickable.length} dishes picked</div>
          <div className="progress"><div style={{ width: `${pickable.length ? (picked / pickable.length) * 100 : 0}%` }} /></div>
        </div>
        <div className="seg">
          {(['all', 'todo', 'done'] as const).map((f) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'todo' ? 'Need a pick' : 'Picked'}
            </button>
          ))}
        </div>
      </div>
      {CATEGORIES.map(([cat, label]) => {
        const list = dishes.filter((d) => d.category === cat)
        if (!list.length) return null
        return (
          <div key={cat}>
            <h2 className="section-title">{label}</h2>
            {list.map((d) => <DishCard key={d.id} dish={d} options={byDish.get(d.id) ?? []} />)}
          </div>
        )
      })}
      {!dishes.length && <p className="empty">Nothing here — nice work! 🎉</p>}
      {removedDishes.length > 0 && (
        <details className="card removed">
          <summary>🙈 Removed dishes ({removedDishes.length})</summary>
          <ul className="removed-list">
            {removedDishes.map((d) => (
              <li key={d.id}>
                <span>{d.name}</span>
                <button className="chip-btn" onClick={() => upsert('dishes', { id: d.id, removed: false })}>↩ Put back</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
