import { useMemo, useState } from 'react'
import { useDB } from '../lib/db'
import { buildGroceries, STORES, type GroceryLine } from '../lib/grocery'
import { uid } from '../lib/format'
import { confetti } from './confetti'

const STORE_STYLE: Record<string, { emoji: string; cls: string }> = {
  Costco: { emoji: '📦', cls: 'st-sams' },
  HEB: { emoji: '🛒', cls: 'st-meijer' },
  Other: { emoji: '🛍️', cls: 'st-other' },
}

export function Groceries() {
  const { db, upsert, remove } = useDB()
  const lines = useMemo(() => buildGroceries(db), [db])
  const [hideChecked, setHideChecked] = useState(false)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [store, setStore] = useState<string>('HEB')

  const unpicked = [...db.dishes].sort((a, b) => a.sort - b.sort).filter((d) => !d.chosen_recipe_id && db.recipes.some((r) => r.dish_id === d.id))
  const done = lines.filter((l) => l.checked).length

  const toggle = (l: GroceryLine) => {
    const checked = !l.checked
    if (l.extraId) upsert('grocery_extras', { id: l.extraId, checked })
    else upsert('grocery_state', { item_key: l.key, checked, store: l.store, updated_at: new Date().toISOString() })
    if (checked) {
      const rest = lines.filter((x) => x.store === l.store && x.key !== l.key && !x.checked)
      if (!rest.length) confetti()
    }
  }
  const move = (l: GroceryLine, s: string) => {
    if (l.extraId) upsert('grocery_extras', { id: l.extraId, store: s })
    else upsert('grocery_state', { item_key: l.key, checked: l.checked, store: s, updated_at: new Date().toISOString() })
  }
  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    upsert('grocery_extras', { id: uid(), name: name.trim(), qty: qty.trim() || null, store, checked: false, created_at: new Date().toISOString() })
    setName('')
    setQty('')
  }

  return (
    <div className="page">
      <div className="card hero-mini">
        <div>
          <h2>🛒 Grocery List</h2>
          <p className="muted">Built automatically from the recipes you pick, with amounts added up across dishes. Check things off as you shop — everyone sees it live.</p>
        </div>
        <div className="progress-wrap">
          <div className="progress-label"><b>{done}</b> of {lines.length} in the cart</div>
          <div className="progress"><div style={{ width: `${lines.length ? (done / lines.length) * 100 : 0}%` }} /></div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={hideChecked} onChange={(e) => setHideChecked(e.target.checked)} /> Hide checked items
        </label>
      </div>

      {unpicked.length > 0 && (
        <div className="notice">
          🍽️ <b>{unpicked.length} dishes</b> don't have a recipe picked yet, so their ingredients aren't on the list: {unpicked.map((d) => d.name).join(', ')}.{' '}
          <a href="#recipes">Pick recipes →</a>
        </div>
      )}

      <form className="card add-item" onSubmit={addItem}>
        <input placeholder="Add an item (foil, ice, wine…)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Item name" />
        <input placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} className="qty" aria-label="Quantity" />
        <select value={store} onChange={(e) => setStore(e.target.value)} aria-label="Store">
          {STORES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn primary">Add</button>
      </form>

      <div className="stores">
        {STORES.map((s) => {
          const all = lines.filter((l) => l.store === s)
          const shown = hideChecked ? all.filter((l) => !l.checked) : all
          if (!all.length) return null
          const left = all.filter((l) => !l.checked).length
          return (
            <section key={s} className={`card store ${STORE_STYLE[s].cls}`}>
              <header>
                <h3>{STORE_STYLE[s].emoji} {s}</h3>
                <span className="pill">{left ? `${left} left` : 'All done! 🎉'}</span>
              </header>
              <ul className="glist">
                {shown.map((l) => (
                  <li key={l.key} className={l.checked ? 'checked' : ''}>
                    <button className="check" onClick={() => toggle(l)} aria-label={`${l.checked ? 'Uncheck' : 'Check'} ${l.name}`}>{l.checked ? '✓' : ''}</button>
                    <div className="gtext" onClick={() => toggle(l)}>
                      <span className="gname">{l.name}</span>
                      {l.qty && <span className="gqty">{l.qty}</span>}
                      {l.dishes.length > 0 && <span className="gfor">for {l.dishes.join(', ')}</span>}
                    </div>
                    <select className="gstore" value={l.store} onChange={(e) => move(l, e.target.value)} aria-label={`Store for ${l.name}`}>
                      {STORES.map((x) => <option key={x}>{x}</option>)}
                    </select>
                    {l.extraId && <button className="x" onClick={() => remove('grocery_extras', l.extraId!)} aria-label={`Remove ${l.name}`}>✕</button>}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
