import type { Timer } from '../types'
import { useDB } from './db'
import { uid } from './format'

export function remainingSec(t: Timer, now: Date): number {
  if (t.status === 'paused') return t.remaining_sec ?? 0
  if (t.status === 'ringing') return 0
  if (!t.ends_at) return 0
  return Math.max(0, (new Date(t.ends_at).getTime() - now.getTime()) / 1000)
}

export function isRinging(t: Timer, now: Date): boolean {
  return t.status === 'ringing' || (t.status === 'running' && !!t.ends_at && new Date(t.ends_at) <= now)
}

export function useTimerActions() {
  const { upsert, remove } = useDB()
  return {
    start(label: string, sec: number) {
      upsert('timers', {
        id: uid(), label, duration_sec: sec, ends_at: new Date(Date.now() + sec * 1000).toISOString(),
        remaining_sec: null, status: 'running', created_at: new Date().toISOString(),
      })
    },
    pause(t: Timer) {
      upsert('timers', { id: t.id, status: 'paused', remaining_sec: Math.round(remainingSec(t, new Date())), ends_at: null })
    },
    resume(t: Timer) {
      upsert('timers', { id: t.id, status: 'running', ends_at: new Date(Date.now() + (t.remaining_sec ?? 0) * 1000).toISOString(), remaining_sec: null })
    },
    add(t: Timer, sec: number) {
      if (t.status === 'paused') return upsert('timers', { id: t.id, remaining_sec: (t.remaining_sec ?? 0) + sec, duration_sec: t.duration_sec + sec })
      const base = t.status === 'ringing' || !t.ends_at ? Date.now() : Math.max(Date.now(), new Date(t.ends_at).getTime())
      upsert('timers', { id: t.id, status: 'running', ends_at: new Date(base + sec * 1000).toISOString(), duration_sec: t.status === 'ringing' ? sec : t.duration_sec + sec })
    },
    cancel(t: Timer) {
      remove('timers', t.id)
    },
  }
}
