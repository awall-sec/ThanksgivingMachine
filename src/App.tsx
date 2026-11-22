import { useEffect, useRef, useState } from 'react'
import { DBContext, useDB, useLiveDB, useNow } from './lib/db'
import { isRinging, useTimerActions } from './lib/timers'
import { audioReady, startRinging, stopRinging, unlockAudio } from './lib/sound'
import { Dashboard } from './components/Dashboard'
import { Recipes } from './components/Recipes'
import { Groceries } from './components/Groceries'
import { Turkey } from './components/Turkey'

type Tab = 'dashboard' | 'recipes' | 'groceries'
const TABS: [Tab, string, string][] = [['dashboard', '🦃', 'Prep'], ['recipes', '📖', 'Recipes'], ['groceries', '🛒', 'Groceries']]

function useHashTab(): [Tab, (t: Tab) => void] {
  const read = (): Tab => {
    const h = window.location.hash.replace('#', '') as Tab
    return TABS.some(([t]) => t === h) ? h : 'dashboard'
  }
  const [tab, setTab] = useState<Tab>(read)
  useEffect(() => {
    const on = () => {
      setTab(read())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return [tab, (t) => (window.location.hash = t)]
}

function useWakeLock() {
  const [on, setOn] = useState(false)
  const lock = useRef<WakeLockSentinel | null>(null)
  const supported = 'wakeLock' in navigator
  useEffect(() => {
    if (!on || !supported) return
    let cancelled = false
    const req = async () => {
      try {
        lock.current = await navigator.wakeLock.request('screen')
      } catch {
        if (!cancelled) setOn(false)
      }
    }
    req()
    const onVis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      lock.current?.release().catch(() => {})
      lock.current = null
    }
  }, [on, supported])
  return { on, setOn, supported }
}

function RingingOverlay() {
  const live = useDB()
  const now = useNow(500)
  const a = useTimerActions()
  const ringing = live.db.timers.filter((t) => isRinging(t, now))
  // Mark finished timers as ringing so every device agrees.
  useEffect(() => {
    for (const t of live.db.timers) if (t.status === 'running' && isRinging(t, now)) live.upsert('timers', { id: t.id, status: 'ringing' })
  }, [now, live])
  const any = ringing.length > 0
  useEffect(() => {
    if (any) startRinging()
    else stopRinging()
  }, [any])
  useEffect(() => () => stopRinging(), [])
  if (!any) return null
  return (
    <div className="ring-overlay" role="alertdialog" aria-label="Timer finished">
      <div className="card ring-card">
        <Turkey size={140} mood="alarm" />
        <h2>GOBBLE GOBBLE!</h2>
        {ringing.map((t) => (
          <div key={t.id} className="ring-item">
            <div className="ring-name">⏰ {t.label} is done!</div>
            <div className="row center">
              <button className="btn good" onClick={() => a.cancel(t)}>Got it!</button>
              <button className="btn ghost" onClick={() => a.add(t, 5 * 60)}>+5 min</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default function App() {
  const live = useLiveDB()
  const [tab, setTab] = useHashTab()
  const [sound, setSound] = useState(audioReady())
  const wake = useWakeLock()

  useEffect(() => {
    const unlock = () => {
      if (unlockAudio()) window.setTimeout(() => setSound(audioReady()), 150)
    }
    document.addEventListener('pointerdown', unlock)
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <DBContext.Provider value={live}>
      <div className="app">
        <header className="topbar">
          <a className="brand" href="#dashboard">
            <Turkey size={44} />
            <span>Thanksgiving<br /><b>Machine</b></span>
          </a>
          <nav className="tabs desktop">
            {TABS.map(([t, e, l]) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{e} {l}</button>)}
          </nav>
          <div className="status">
            {wake.supported && (
              <button className={`chip-btn ${wake.on ? 'on' : ''}`} onClick={() => wake.setOn(!wake.on)} title="Keep this screen awake so timers can ring">
                {wake.on ? '☀️ Screen stays on' : '🌙 Keep screen on'}
              </button>
            )}
            <span className={`dot ${live.connected ? 'ok' : 'off'}`} title={live.connected ? 'Live: changes sync to everyone' : 'Reconnecting…'} />
          </div>
        </header>

        {!sound && <div className="sound-banner">🔔 Tap anywhere to turn on timer alarms on this device</div>}
        {live.error && <div className="notice bad">😬 {live.error}</div>}

        <main>
          {!live.ready ? (
            <div className="loading"><Turkey size={120} /><p>Warming up the oven…</p></div>
          ) : tab === 'dashboard' ? <Dashboard /> : tab === 'recipes' ? <Recipes /> : <Groceries />}
        </main>

        <nav className="tabs mobile">
          {TABS.map(([t, e, l]) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              <span className="tab-emoji">{e}</span>
              <span>{l}</span>
            </button>
          ))}
        </nav>
        {live.ready && <RingingOverlay />}
      </div>
    </DBContext.Provider>
  )
}
