import { useMemo, useState } from 'react'
import { useDB } from '../lib/db'
import { EQ } from '../lib/schedule'
import { canonUnit } from '../lib/grocery'
import { fmtMinutes, fmtQty } from '../lib/format'
import type { Dish, Ingredient, Recipe } from '../types'
import { confetti } from './confetti'

const CATEGORIES: [string, string][] = [['main', '🦃 Mains'], ['prep', '🧂 Prep Work'], ['side', '🥔 Sides'], ['dessert', '🥧 Desserts']]

export function fmtIngredient(i: Ingredient): string {
  return [i.qty != null ? fmtQty(i.qty) : '', i.unit, i.item].filter(Boolean).join(' ')
}

const UNIT_WORDS = new Set(['cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'lb', 'lbs', 'oz', 'can', 'cans', 'box', 'boxes', 'gallon', 'gallons', 'clove', 'cloves', 'stalk', 'stalks', 'sprig', 'sprigs', 'slice', 'slices', 'jar', 'jars', 'package', 'packages', 'packet', 'packets', 'pound', 'pounds'])
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

function OptionCard({ recipe, dish, picked }: { recipe: Recipe; dish: Dish; picked: boolean }) {
  const { upsert } = useDB()
  const [editing, setEditing] = useState(false)
  const eq = recipe.equipment ? EQ[recipe.equipment] : null
  const pick = () => {
    upsert('dishes', { id: dish.id, chosen_recipe_id: picked ? null : recipe.id })
    if (!picked) confetti(24)
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
      </div>
      {editing && <EditModal recipe={recipe} onClose={() => setEditing(false)} />}
    </div>
  )
}

function DishCard({ dish, options }: { dish: Dish; options: Recipe[] }) {
  const { upsert } = useDB()
  const chosen = options.find((r) => r.id === dish.chosen_recipe_id)
  const [open, setOpen] = useState(!chosen && options.length > 0)
  const [who, setWho] = useState(dish.who ?? '')
  return (
    <section className={`dish card ${chosen ? 'has-pick' : options.length ? 'needs-pick' : ''}`}>
      <header className="dish-head" onClick={() => options.length && setOpen(!open)}>
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
        {options.length > 0 && <span className={`chev ${open ? 'open' : ''}`}>▾</span>}
      </header>
      {open && (
        <div className="options">
          {options.map((r) => <OptionCard key={r.id} recipe={r} dish={dish} picked={r.id === dish.chosen_recipe_id} />)}
        </div>
      )}
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
  const pickable = db.dishes.filter((d) => byDish.has(d.id))
  const picked = pickable.filter((d) => d.chosen_recipe_id).length
  const dishes = [...db.dishes].sort((a, b) => a.sort - b.sort).filter((d) =>
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
    </div>
  )
}
