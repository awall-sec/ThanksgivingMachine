export const DEFAULT_DINNER = '2026-11-26T14:00:00-06:00'

// Dinner is in Central time. Every device shows kitchen time, wherever it is.
export const TZ = 'America/Chicago'

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: TZ })
}

export function fmtHour(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', timeZone: TZ })
}

export function fmtDay(d: Date, long = false): string {
  return d.toLocaleDateString([], long ? { weekday: 'long', month: 'short', day: 'numeric', timeZone: TZ } : { weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ })
}

export function fmtParts(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString([], { ...opts, timeZone: TZ })
}

/** Calendar day in kitchen time, e.g. "2026-11-26". */
export function tzDayKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}

function tzParts(ms: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  )
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second }
}

/** Value for <input type="datetime-local"> in kitchen time. */
export function toTZInput(d: Date): string {
  const t = tzParts(d.getTime())
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.y}-${p(t.mo)}-${p(t.d)}T${p(t.h)}:${p(t.mi)}`
}

/** Parse a datetime-local value as kitchen time. */
export function fromTZInput(v: string): Date {
  const [date, time] = v.split('T')
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const t = tzParts(guess)
  const offset = Date.UTC(t.y, t.mo - 1, t.d, t.h, t.mi, t.s) - guess
  return new Date(guess - offset)
}

export function fmtMinutes(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export function fmtCountdown(ms: number): string {
  if (ms <= 0) return 'now!'
  const min = Math.floor(ms / 60000)
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${Math.floor((ms % 60000) / 1000)}s`
}

export function fmtRelative(ms: number): string {
  const min = Math.round(ms / 60000)
  if (Math.abs(min) < 1) return 'now'
  const a = Math.abs(min)
  const txt = a < 60 ? `${a} min` : a < 1440 ? fmtMinutes(a) : `${Math.round(a / 1440)} day${Math.round(a / 1440) === 1 ? '' : 's'}`
  return min > 0 ? `in ${txt}` : `${txt} ago`
}

const FRACTIONS: [number, string][] = [[0.125, '⅛'], [0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾']]

export function fmtQty(q: number): string {
  const whole = Math.floor(q + 0.001)
  const frac = q - whole
  if (frac < 0.06) return String(whole)
  const f = FRACTIONS.find(([v]) => Math.abs(v - frac) < 0.05)
  if (f) return whole ? `${whole} ${f[1]}` : f[1]
  return String(Math.round(q * 100) / 100)
}

export function uid(): string {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
