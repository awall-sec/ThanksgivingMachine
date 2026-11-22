import { useState } from 'react'
import { useDB, useNow } from '../lib/db'
import { fmtClock } from '../lib/format'
import { isRinging, remainingSec, useTimerActions } from '../lib/timers'
import type { Timer } from '../types'

const PRESETS = [5, 10, 15, 20, 30, 45, 60]

function Ring({ t, now }: { t: Timer; now: Date }) {
  const a = useTimerActions()
  const rem = remainingSec(t, now)
  const ringing = isRinging(t, now)
  const frac = t.duration_sec ? Math.min(1, rem / t.duration_sec) : 0
  const C = 2 * Math.PI * 44
  return (
    <div className={`timer ${ringing ? 'ringing' : ''} ${t.status === 'paused' ? 'paused' : ''}`}>
      <svg viewBox="0 0 100 100" className="ring">
        <circle cx="50" cy="50" r="44" className="ring-bg" />
        <circle cx="50" cy="50" r="44" className="ring-fg" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 50 50)" />
        <text x="50" y="55" textAnchor="middle" className="ring-text">{ringing ? '🔔' : fmtClock(rem)}</text>
      </svg>
      <div className="timer-label" title={t.label}>{t.label}</div>
      <div className="timer-btns">
        {t.status === 'running' && !ringing && <button onClick={() => a.pause(t)} aria-label="Pause">⏸</button>}
        {t.status === 'paused' && <button onClick={() => a.resume(t)} aria-label="Resume">▶</button>}
        <button onClick={() => a.add(t, 60)} aria-label="Add one minute">+1m</button>
        <button onClick={() => a.cancel(t)} aria-label="Cancel timer">✕</button>
      </div>
    </div>
  )
}

export function TimersPanel() {
  const { db } = useDB()
  const now = useNow(250)
  const a = useTimerActions()
  const [label, setLabel] = useState('')
  const [mins, setMins] = useState('15')
  const timers = db.timers.filter((t) => t.status !== 'dismissed').sort((x, y) => (x.created_at ?? '').localeCompare(y.created_at ?? ''))
  const start = (m: number) => {
    if (!m || m <= 0) return
    a.start(label.trim() || `${m} min timer`, Math.round(m * 60))
    setLabel('')
  }
  return (
    <section className="card timers-card">
      <h2>⏲️ Timers <small className="muted">shared on every device</small></h2>
      {timers.length > 0 ? (
        <div className="timers">{timers.map((t) => <Ring key={t.id} t={t} now={now} />)}</div>
      ) : (
        <p className="muted">No timers running. Start one below, or tap ⏱ on any task.</p>
      )}
      <form className="new-timer" onSubmit={(e) => { e.preventDefault(); start(Number(mins)) }}>
        <input placeholder="What's cooking? (e.g. Potatoes)" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Timer label" />
        <input type="number" min="1" max="600" value={mins} onChange={(e) => setMins(e.target.value)} className="mins" aria-label="Minutes" />
        <button className="btn primary">Start</button>
      </form>
      <div className="presets">
        {PRESETS.map((m) => <button key={m} className="chip-btn" onClick={() => start(m)}>{m}m</button>)}
      </div>
    </section>
  )
}
