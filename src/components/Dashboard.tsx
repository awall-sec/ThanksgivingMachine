import { useMemo, useState } from 'react'
import { useDB, useNow } from '../lib/db'
import { buildSchedule, dayKey, dinnerTime, EQ, findConflicts, LANE_ORDER, type SchedItem } from '../lib/schedule'
import { fmtCountdown, fmtDay, fmtHour, fmtMinutes, fmtParts, fmtRelative, fmtTime, fromTZInput, toTZInput } from '../lib/format'
import { useTimerActions } from '../lib/timers'
import { uid } from '../lib/format'
import type { Eq } from '../types'
import { Turkey } from './Turkey'
import { TimersPanel } from './Timers'
import { confetti } from './confetti'
import { addDays, dayDiff, usePointerDrag, type DragState, type DropTarget } from '../lib/drag'

function useTaskActions() {
  const { upsert } = useDB()
  return {
    toggle(it: SchedItem) {
      upsert('task_state', { task_key: it.key, done: !it.done, shift_min: it.shift, updated_at: new Date().toISOString() })
      if (!it.done) confetti()
    },
    nudge(it: SchedItem, d: number) {
      upsert('task_state', { task_key: it.key, done: it.done, shift_min: it.shift + d, updated_at: new Date().toISOString() })
    },
    hide(it: SchedItem, hidden = true) {
      upsert('task_state', { task_key: it.key, done: it.done, shift_min: it.shift, hidden, updated_at: new Date().toISOString() })
    },
  }
}

const PX = 2.2 // timeline px per minute
const SNAP = 5 // minutes
const snapMin = (dxPx: number) => Math.round(dxPx / PX / SNAP) * SNAP

const STEP_IDEAS = ['Get out the serving dishes', 'Set the table', 'Chill the drinks', 'Clear space in the fridge', 'Take out the trash', 'Run the dishwasher', 'Get out serving spoons', 'Make coffee']
const STEP_EQ: Eq[] = ['counter', 'oven', 'stove', 'fryer', 'smoker', 'microwave', 'fridge']

/** Form to put your own step (like "Get out the dishes") on the plan. */
function AddStep({ dayKey: dk, days, dinner }: { dayKey: string; days: { key: string; date: Date }[]; dinner: Date }) {
  const { db, upsert } = useDB()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [day, setDay] = useState(dk)
  const [time, setTime] = useState('12:00')
  const [dur, setDur] = useState('15')
  const [eq, setEq] = useState<Eq>('counter')
  const [temp, setTemp] = useState('350')
  const hot = eq === 'oven' || eq === 'smoker'
  const openForm = () => { setDay(dk); setOpen(true) }
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    const at = Math.round((fromTZInput(`${day}T${time}`).getTime() - dinner.getTime()) / 60000)
    upsert('tasks', {
      id: `own-${uid()}`,
      label: label.trim(),
      offset_min: at,
      duration_min: Math.max(1, Number(dur) || 15),
      equipment: eq,
      temp_f: hot ? Number(temp) || null : null,
      sort: 1000 + db.tasks.length,
      notes: null,
    })
    setLabel('')
    setOpen(false)
  }
  if (!open) return <button className="btn ghost add-step-btn" onClick={openForm}>➕ Add a step</button>
  return (
    <form className="add-step" onSubmit={save}>
      <input autoFocus placeholder="What needs doing? (Get out the dishes…)" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Step" className="grow" />
      <div className="ideas">
        {STEP_IDEAS.map((x) => <button type="button" key={x} className="chip-btn" onClick={() => setLabel(x)}>{x}</button>)}
      </div>
      <div className="row wrap">
        <label>Day
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {days.map((d) => <option key={d.key} value={d.key}>{fmtDay(d.date)}</option>)}
          </select>
        </label>
        <label>Time<input type="time" value={time} step={300} onChange={(e) => setTime(e.target.value)} /></label>
        <label>Minutes<input type="number" min="1" max="1440" value={dur} onChange={(e) => setDur(e.target.value)} className="num" /></label>
        <label>Where
          <select value={eq} onChange={(e) => setEq(e.target.value as Eq)}>
            {STEP_EQ.map((x) => <option key={x} value={x}>{EQ[x].emoji} {EQ[x].label}</option>)}
          </select>
        </label>
        {hot && <label>°F<input type="number" min="150" max="550" value={temp} onChange={(e) => setTemp(e.target.value)} className="num" /></label>}
      </div>
      <div className="row">
        <button className="btn primary" disabled={!label.trim()}>Add to plan</button>
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  )
}

const HOT: Eq[] = ['oven', 'smoker', 'fryer']

/** Inline editor for a step's start time, length and temperature. */
function EditStep({ it, onClose }: { it: SchedItem; onClose: () => void }) {
  const { upsert } = useDB()
  const ta = useTaskActions()
  const [when, setWhen] = useState(toTZInput(it.start))
  const [dur, setDur] = useState(String(it.dur))
  const [temp, setTemp] = useState(it.temp ? String(it.temp) : '')
  const showTemp = HOT.includes(it.eq) || it.temp != null
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (when) {
      const delta = Math.round((fromTZInput(when).getTime() - it.start.getTime()) / 60000)
      if (delta) ta.nudge(it, delta)
    }
    const d = Math.max(1, Math.round(Number(dur)) || it.dur)
    const t = showTemp ? (temp.trim() ? Math.round(Number(temp)) || null : null) : it.temp
    if (d !== it.dur || t !== it.temp) {
      if (it.choreId) upsert('tasks', { id: it.choreId, duration_min: d, temp_f: t })
      else if (it.recipe && it.taskId) {
        upsert('recipes', { id: it.recipe.id, tasks: it.recipe.tasks.map((x) => (x.id === it.taskId ? { ...x, dur: d, temp: t } : x)) })
      }
    }
    onClose()
  }
  return (
    <form className="edit-step" onSubmit={save} onClick={(e) => e.stopPropagation()}>
      <label>Starts<input type="datetime-local" step={300} value={when} onChange={(e) => setWhen(e.target.value)} /></label>
      <label>Minutes<input type="number" min="1" max="2880" value={dur} onChange={(e) => setDur(e.target.value)} className="num" /></label>
      {showTemp && <label>°F<input type="number" min="100" max="600" value={temp} placeholder="—" onChange={(e) => setTemp(e.target.value)} className="num" /></label>}
      <div className="row">
        <button className="btn primary sm">Save</button>
        <button type="button" className="btn ghost sm" onClick={onClose}>Cancel</button>
      </div>
    </form>
  )
}

function fmtShift(min: number): string {
  const a = Math.abs(min)
  const d = Math.floor(a / 1440)
  const rest = a % 1440
  const parts = [d ? `${d} day${d > 1 ? 's' : ''}` : '', rest ? fmtMinutes(rest) : ''].filter(Boolean).join(' ')
  return `${parts} ${min > 0 ? 'later' : 'earlier'}`
}

interface DragProps {
  onDragStart?: (e: React.PointerEvent) => void
  dragging?: boolean
  over?: boolean
}

function TaskRow({ it, now, conflict, compact = false, onDragStart, dragging, over }: { it: SchedItem; now: Date; conflict?: boolean; compact?: boolean } & DragProps) {
  const ta = useTaskActions()
  const timers = useTimerActions()
  const [more, setMore] = useState(false)
  const [editing, setEditing] = useState(false)
  const startEdit = (e: React.MouseEvent) => { e.stopPropagation(); setEditing(true) }
  const late = !it.done && it.end < now
  const active = !it.done && it.start <= now && it.end > now
  const eq = EQ[it.eq]
  return (
    <li
      className={`task ${it.done ? 'done' : ''} ${late ? 'late' : ''} ${active ? 'active' : ''} ${conflict ? 'conflict' : ''} ${dragging ? 'dragging' : ''} ${over ? 'drop-over' : ''}`}
      style={{ ['--lane' as string]: eq.color }}
      data-drop-task={compact ? undefined : it.key}
    >
      {onDragStart && (
        <button className="drag-handle" onPointerDown={onDragStart} onContextMenu={(e) => e.preventDefault()} aria-label={`Drag ${it.label} to another time or day`} title="Drag onto a day, or onto another step to line up with it">⠿</button>
      )}
      <button className="check big" onClick={() => ta.toggle(it)} aria-label={`${it.done ? 'Undo' : 'Done'}: ${it.label}`}>{it.done ? '✓' : ''}</button>
      <div className="task-body" onClick={() => setMore(!more)}>
        <div className="task-time">
          {compact ? fmtTime(it.start) : <button className="time-btn" onClick={startEdit} title="Change the time">{fmtTime(it.start)}</button>}
          {compact && <span className="muted"> · {fmtDay(it.start)}</span>}
          {late && <span className="tag late">late</span>}
          {active && <span className="tag now">now</span>}
          {conflict && <span className="tag conflict">clash</span>}
        </div>
        <div className="task-label">{eq.emoji} {it.label}</div>
        <div className="chips">
          {it.dish && <span className="chip">{it.dish.name}{it.dish.who ? ` · ${it.dish.who}` : ''}</span>}
          <span className="chip">{fmtMinutes(it.dur)}</span>
          {it.temp && (compact
            ? <span className="chip hot">{it.temp}°F</span>
            : <button className="chip hot" onClick={startEdit} title="Change the temperature">{it.temp}°F</button>)}
          {it.shift !== 0 && (
            <button className="chip moved" onClick={(e) => { e.stopPropagation(); ta.nudge(it, -it.shift) }} title="Put back at the original time">
              moved {fmtShift(it.shift)} ↺
            </button>
          )}
        </div>
        {more && it.notes && <p className="muted small">{it.notes}</p>}
        {editing && <EditStep it={it} onClose={() => setEditing(false)} />}
      </div>
      <div className="task-actions">
        {it.dur >= 2 && !it.done && (
          <button className="icon-btn" onClick={() => timers.start(it.label, it.dur * 60)} aria-label={`Start ${it.dur} minute timer`} title={`Start ${fmtMinutes(it.dur)} timer`}>⏱</button>
        )}
        {!compact && (
          <>
            <button className="icon-btn sm" onClick={() => setEditing(!editing)} title="Edit time, length and temperature" aria-label={`Edit ${it.label}`}>✏️</button>
            <button className="icon-btn sm" onClick={() => ta.nudge(it, -15)} title="15 min earlier" aria-label="Move 15 minutes earlier">−15</button>
            <button className="icon-btn sm" onClick={() => ta.nudge(it, 15)} title="15 min later" aria-label="Move 15 minutes later">+15</button>
            <button className="x" onClick={() => ta.hide(it)} title="Remove from the plan" aria-label={`Remove ${it.label} from the plan`}>✕</button>
          </>
        )}
      </div>
    </li>
  )
}

function Timeline({ items, now, clash, drag, startDrag, wasDrag }: {
  items: SchedItem[]
  now: Date
  clash: Set<string>
  drag: DragState | null
  startDrag: (e: React.PointerEvent, key: string) => void
  wasDrag: () => boolean
}) {
  const ta = useTaskActions()
  if (!items.length) return <p className="muted small tl-empty">Nothing planned this day yet — drag a step onto this day's tab to move it here.</p>
  const t0 = new Date(Math.min(...items.map((i) => i.start.getTime())))
  t0.setMinutes(0, 0, 0)
  const t1 = new Date(Math.max(...items.map((i) => i.end.getTime())))
  if (t1.getMinutes() || t1.getSeconds()) t1.setHours(t1.getHours() + 1, 0, 0, 0)
  const span = (t1.getTime() - t0.getTime()) / 60000
  const width = span * PX
  const hours: Date[] = []
  for (let t = t0.getTime(); t <= t1.getTime(); t += 3600000) hours.push(new Date(t))
  const x = (d: Date) => ((d.getTime() - t0.getTime()) / 60000) * PX
  const lanes = LANE_ORDER.map((eq) => {
    const list = items.filter((i) => i.eq === eq)
    const rows: number[] = [] // end time per row
    const placed = list.map((it) => {
      let r = rows.findIndex((end) => end <= it.start.getTime())
      if (r === -1) r = rows.push(0) - 1
      rows[r] = it.end.getTime()
      return { it, r }
    })
    return { eq, placed, rows: Math.max(1, rows.length) }
  }).filter((l) => l.placed.length)
  const nowIn = now >= t0 && now <= t1
  return (
    <div className="timeline-wrap">
      <div className="timeline" style={{ width: width + 120 }}>
        <div className="tl-hours">
          {hours.map((h) => <span key={h.getTime()} style={{ left: x(h) }}>{fmtHour(h)}</span>)}
        </div>
        {lanes.map((l) => (
          <div className="tl-lane" key={l.eq} style={{ height: l.rows * 40 + 12 }}>
            <div className="tl-name" style={{ background: EQ[l.eq].color }}>{EQ[l.eq].emoji} {EQ[l.eq].label}</div>
            <div className="tl-track" style={{ width }}>
              {hours.map((h) => <i key={h.getTime()} className="tl-grid" style={{ left: x(h) }} />)}
              {l.placed.map(({ it, r }) => {
                const mine = drag?.key === `bar:${it.key}`
                const free = mine && !drag!.target
                const shift = free ? snapMin(drag!.dx) : 0
                return (
                  <button
                    key={it.key}
                    className={`tl-bar ${it.done ? 'done' : ''} ${clash.has(it.key) ? 'conflict' : ''} ${mine ? 'dragging' : ''}`}
                    style={{ left: x(it.start) + shift * PX, width: Math.max(it.dur * PX, 30), top: 6 + r * 40, background: EQ[l.eq].color }}
                    title={`${fmtTime(it.start)}–${fmtTime(it.end)} ${it.label}${it.temp ? ` (${it.temp}°F)` : ''} · drag to move, tap to mark done`}
                    onPointerDown={(e) => startDrag(e, `bar:${it.key}`)}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => { if (!wasDrag()) ta.toggle(it) }}
                  >
                    {free && <span className="tl-when">{fmtTime(new Date(it.start.getTime() + shift * 60000))}</span>}
                    {it.done ? '✓ ' : ''}{it.temp ? `${it.temp}° ` : ''}{it.label}
                  </button>
                )
              })}
              {nowIn && <div className="tl-now" style={{ left: x(now) }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { db, upsert, remove } = useDB()
  const now = useNow(1000)
  const allItems = useMemo(() => buildSchedule(db), [db])
  const items = useMemo(() => allItems.filter((i) => !i.hidden), [allItems])
  const hiddenItems = allItems.filter((i) => i.hidden)
  const conflicts = useMemo(() => findConflicts(items), [items])
  const clash = useMemo(() => new Set(conflicts.flatMap((c) => (c.all ?? [c.a, c.b]).map((i) => i.key))), [conflicts])
  const dinner = dinnerTime(db)
  const [editDinner, setEditDinner] = useState(false)
  const unpicked = [...db.dishes].sort((a, b) => a.sort - b.sort).filter((d) => !d.removed && !d.chosen_recipe_id && db.recipes.some((r) => r.dish_id === d.id))

  // Every day from the day before the first step through dinner day, so steps can be dragged onto empty days too.
  const days = useMemo(() => {
    const m = new Map<string, { key: string; date: Date; items: SchedItem[] }>()
    for (const it of items) {
      const k = dayKey(it.start)
      if (!m.has(k)) m.set(k, { key: k, date: it.start, items: [] })
      m.get(k)!.items.push(it)
    }
    const keys = [...m.keys(), dayKey(dinner)].sort()
    if (items.length) {
      const last = keys[keys.length - 1]
      for (let k = addDays(keys[0], -1); k <= last; k = addDays(k, 1)) {
        if (!m.has(k)) m.set(k, { key: k, date: fromTZInput(`${k}T12:00`), items: [] })
      }
    }
    return [...m.values()].sort((a, b) => a.key.localeCompare(b.key))
  }, [items, dinner.getTime()])

  const ta = useTaskActions()
  const onDrop = (dragKey: string, dx: number, target: DropTarget) => {
    const [mode, ...rest] = dragKey.split(':')
    const key = rest.join(':')
    const it = items.find((i) => i.key === key)
    if (!it) return
    let delta = 0
    if (target && 'day' in target) {
      delta = dayDiff(dayKey(it.start), target.day) * 1440
      if (mode === 'bar') delta += snapMin(dx)
      setPickedDay(target.day)
    } else if (target && 'taskKey' in target) {
      const t = items.find((i) => i.key === target.taskKey)
      if (t && t.key !== key) delta = Math.round((t.start.getTime() - it.start.getTime()) / 60000)
    } else if (mode === 'bar') delta = snapMin(dx)
    if (delta) ta.nudge(it, delta)
  }
  const { drag, start: startDrag, wasDrag } = usePointerDrag(onDrop)
  const dragItem = drag ? items.find((i) => drag.key.endsWith(`:${i.key}`)) : undefined
  const dragHint = (() => {
    if (!drag || !dragItem) return ''
    const t = drag.target
    if (t && 'day' in t) {
      const d = days.find((x) => x.key === t.day)
      return `→ ${d ? fmtDay(d.date) : t.day} at ${fmtTime(new Date(dragItem.start.getTime() + (drag.key.startsWith('bar:') ? snapMin(drag.dx) : 0) * 60000))}`
    }
    if (t && 'taskKey' in t) {
      const o = items.find((i) => i.key === t.taskKey)
      return o && o.key !== dragItem.key ? `→ ${fmtTime(o.start)} with ${o.label}` : ''
    }
    if (drag.key.startsWith('bar:')) {
      const m = snapMin(drag.dx)
      return m ? `${m > 0 ? '+' : ''}${m} min` : ''
    }
    return 'Drop on a day or another step'
  })()
  const [pickedDay, setPickedDay] = useState<string | null>(null)
  const today = dayKey(now)
  const defaultDay = days.find((d) => d.key === today)?.key ?? days.find((d) => d.key > today)?.key ?? days[days.length - 1]?.key
  const activeDay = pickedDay && days.some((d) => d.key === pickedDay) ? pickedDay : defaultDay
  const day = days.find((d) => d.key === activeDay)

  const doNow = items.filter((i) => !i.done && i.start <= now)
  const nextUp = items.filter((i) => !i.done && i.start > now).slice(0, 3)
  const allDone = items.length > 0 && items.every((i) => i.done)
  const toDinner = dinner.getTime() - now.getTime()

  return (
    <div className="page">
      <section className="card hero">
        <Turkey size={110} mood={doNow.length > 3 ? 'alarm' : 'happy'} />
        <div className="hero-text">
          <div className="muted">{toDinner > 0 ? 'Dinner is served in' : 'Dinner time!'}</div>
          <div className="big-count">{toDinner > 0 ? fmtCountdown(toDinner) : '🍽️ Gobble gobble!'}</div>
          {!editDinner ? (
            <button className="link" onClick={() => setEditDinner(true)}>🕑 {fmtDay(dinner, true)} at {fmtTime(dinner)} · change</button>
          ) : (
            <div className="row">
              <input
                type="datetime-local"
                defaultValue={toTZInput(dinner)}
                onChange={(e) => e.target.value && upsert('app_settings', { id: 1, dinner_at: fromTZInput(e.target.value).toISOString() })}
                aria-label="Dinner time"
              />
              <button className="btn ghost" onClick={() => setEditDinner(false)}>Done</button>
            </div>
          )}
          {editDinner && <p className="muted small">Central time. Every step moves with dinner time.</p>}
        </div>
      </section>

      {unpicked.length > 0 && (
        <a className="notice" href="#recipes">
          📖 <b>{unpicked.length} dishes</b> still need a recipe picked before they show up here: {unpicked.map((d) => d.name).join(', ')} →
        </a>
      )}
      {conflicts.length > 0 && (
        <div className="notice bad">
          <b>⚠️ Equipment clash{conflicts.length > 1 ? 'es' : ''}:</b>
          <ul>
            {conflicts.slice(0, 5).map((c, i) => (
              <li key={i}>
                {c.reason}:{' '}
                {(c.all ?? [c.a, c.b]).map((it, j, arr) => (
                  <span key={it.key}><b>{it.label}</b> ({fmtTime(it.start)}){j < arr.length - 2 ? ', ' : j === arr.length - 2 ? ' and ' : ''}</span>
                ))}
                . Drag one to a new time or nudge it with ±15.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid-2">
        <section className="card now-card">
          <h2>👉 Do now</h2>
          {allDone ? (
            <p className="empty">Everything's done. Go eat! 🥧</p>
          ) : doNow.length ? (
            <ul className="tasks">{doNow.slice(0, 6).map((it) => <TaskRow key={it.key} it={it} now={now} conflict={clash.has(it.key)} compact />)}</ul>
          ) : (
            <p className="muted">Nothing due right now. Relax with a cup of coffee ☕</p>
          )}
          {doNow.length > 6 && <p className="muted small">+{doNow.length - 6} more overdue — see the schedule below.</p>}
          {nextUp.length > 0 && (
            <>
              <h3 className="next-title">Next up</h3>
              <ul className="next">
                {nextUp.map((it) => (
                  <li key={it.key}>
                    <span className="when">{fmtRelative(it.start.getTime() - now.getTime())}</span>
                    <span>{EQ[it.eq].emoji} {it.label}</span>
                    <span className="muted"> · {fmtDay(it.start)} {fmtTime(it.start)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <TimersPanel />
      </div>

      <section className="card">
        <h2>🗓️ The Plan</h2>
        <div className="day-tabs" role="tablist">
          {days.map((d) => {
            const left = d.items.filter((i) => !i.done).length
            const isThu = d.key === dayKey(dinner)
            return (
              <button
                key={d.key}
                role="tab"
                aria-selected={d.key === activeDay}
                data-drop-day={d.key}
                className={`${d.key === activeDay ? 'on' : ''} ${drag?.target && 'day' in drag.target && drag.target.day === d.key ? 'drop-over' : ''}`}
                onClick={() => setPickedDay(d.key)}
              >
                <span className="dt-day">{isThu ? '🦃 ' : ''}{fmtParts(d.date, { weekday: 'short' })}</span>
                <span className="dt-date">{fmtParts(d.date, { month: 'short', day: 'numeric' })}</span>
                <span className={`dt-count ${left ? '' : 'zero'}`}>{!d.items.length ? 'free' : left ? `${left} to do` : '✓ done'}</span>
              </button>
            )
          })}
        </div>
        {day && <AddStep dayKey={day.key} days={days.map((d) => ({ key: d.key, date: d.date }))} dinner={dinner} />}
        {day && (
          <>
            {day.items.length > 0 && <p className="muted small drag-tip">✋ Drag a bar sideways to change its time, or drop any step on a day above to move it there.</p>}
            <Timeline items={day.items} now={now} clash={clash} drag={drag} startDrag={startDrag} wasDrag={wasDrag} />
            <ul className="tasks">
              {day.items.map((it) => (
                <TaskRow
                  key={it.key}
                  it={it}
                  now={now}
                  conflict={clash.has(it.key)}
                  onDragStart={(e) => startDrag(e, `row:${it.key}`, true)}
                  dragging={drag?.key === `row:${it.key}`}
                  over={!!drag && !!drag.target && 'taskKey' in drag.target && drag.target.taskKey === it.key && !drag.key.endsWith(`:${it.key}`)}
                />
              ))}
            </ul>
          </>
        )}
        {!days.length && <p className="empty">No steps yet — pick some recipes!</p>}
      </section>
      {hiddenItems.length > 0 && (
        <details className="card removed">
          <summary>🙈 Removed steps ({hiddenItems.length})</summary>
          <ul className="removed-list">
            {hiddenItems.map((it) => (
              <li key={it.key}>
                <span>
                  {EQ[it.eq].emoji} <b>{it.label}</b>
                  <span className="muted"> · {fmtDay(it.start)} {fmtTime(it.start)}{it.dish ? ` · ${it.dish.name}` : ''}</span>
                </span>
                <span className="row">
                  <button className="chip-btn" onClick={() => ta.hide(it, false)}>↩ Put back</button>
                  {it.choreId?.startsWith('own-') && (
                    <button
                      className="chip-btn"
                      onClick={() => {
                        if (!confirm(`Delete "${it.label}" for good?`)) return
                        remove('tasks', it.choreId!)
                        remove('task_state', it.key)
                      }}
                    >🗑 Delete</button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {drag && dragItem && (
        <div className="drop-days" aria-hidden>
          <span className="dd-title">Move to</span>
          {days.map((d) => (
            <div
              key={d.key}
              data-drop-day={d.key}
              className={`dd-day ${d.key === dayKey(dragItem.start) ? 'here' : ''} ${drag.target && 'day' in drag.target && drag.target.day === d.key ? 'drop-over' : ''}`}
            >
              <b>{d.key === dayKey(dinner) ? '🦃 ' : ''}{fmtParts(d.date, { weekday: 'short' })}</b>
              <span>{fmtParts(d.date, { month: 'short', day: 'numeric' })}</span>
            </div>
          ))}
        </div>
      )}
      {drag && dragItem && (
        <div className="drag-ghost" style={{ left: drag.x + 14, top: drag.y + 14 }}>
          <b>{EQ[dragItem.eq].emoji} {dragItem.label}</b>
          {dragHint && <span>{dragHint}</span>}
        </div>
      )}
    </div>
  )
}
