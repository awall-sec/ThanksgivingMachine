import type { DB, Dish, Eq, Recipe } from '../types'
import { DEFAULT_DINNER, tzDayKey } from './format'

export const EQ: Record<Eq, { label: string; emoji: string; color: string }> = {
  fryer: { label: 'Oil-less Fryer', emoji: '🦃', color: 'var(--c-fryer)' },
  smoker: { label: 'Smoker', emoji: '💨', color: 'var(--c-smoker)' },
  oven: { label: 'Oven (3 racks)', emoji: '🔥', color: 'var(--c-oven)' },
  stove: { label: 'Stovetop', emoji: '🍳', color: 'var(--c-stove)' },
  microwave: { label: 'Microwave', emoji: '⚡', color: 'var(--c-micro)' },
  counter: { label: 'Prep & Chores', emoji: '🔪', color: 'var(--c-counter)' },
  fridge: { label: 'Fridge', emoji: '🧊', color: 'var(--c-fridge)' },
}
export const LANE_ORDER: Eq[] = ['fryer', 'smoker', 'oven', 'stove', 'microwave', 'counter', 'fridge']

export interface SchedItem {
  key: string
  label: string
  start: Date
  end: Date
  dur: number
  eq: Eq
  temp: number | null
  done: boolean
  shift: number
  kind: 'recipe' | 'chore'
  dish?: Dish
  recipe?: Recipe
  notes?: string | null
}

export function dinnerTime(db: DB): Date {
  return new Date(db.app_settings[0]?.dinner_at ?? DEFAULT_DINNER)
}

export function buildSchedule(db: DB): SchedItem[] {
  const dinner = dinnerTime(db).getTime()
  const state = new Map(db.task_state.map((s) => [s.task_key, s]))
  const recipes = new Map(db.recipes.map((r) => [r.id, r]))
  const out: SchedItem[] = []
  const add = (key: string, base: Omit<SchedItem, 'key' | 'start' | 'end' | 'done' | 'shift'>, at: number) => {
    const s = state.get(key)
    const shift = s?.shift_min ?? 0
    const start = new Date(dinner + (at + shift) * 60000)
    out.push({ ...base, key, start, end: new Date(start.getTime() + base.dur * 60000), done: s?.done ?? false, shift })
  }
  for (const dish of db.dishes.filter((d) => !d.removed)) {
    const r = dish.chosen_recipe_id ? recipes.get(dish.chosen_recipe_id) : undefined
    if (!r) continue
    for (const t of r.tasks ?? []) {
      add(`${r.id}:${t.id}`, { label: t.label, dur: t.dur, eq: t.eq, temp: t.temp, kind: 'recipe', dish, recipe: r }, t.at)
    }
  }
  for (const c of db.tasks) {
    add(`chore:${c.id}`, { label: c.label, dur: c.duration_min, eq: c.equipment, temp: c.temp_f, kind: 'chore', notes: c.notes }, c.offset_min)
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || a.label.localeCompare(b.label))
}

export interface Conflict {
  a: SchedItem
  b: SchedItem
  reason: string
  /** Every dish involved, when more than two share the blame (oven racks). */
  all?: SchedItem[]
}

export const OVEN_RACKS = 3
// Preheating takes no rack space.
const usesRack = (i: SchedItem) => !/preheat/i.test(i.label)

export function findConflicts(items: SchedItem[]): Conflict[] {
  const out: Conflict[] = []
  const live = items.filter((i) => !i.done)
  const overlap = (a: SchedItem, b: SchedItem) => a.start < b.end && b.start < a.end
  for (const eq of ['oven', 'fryer', 'smoker'] as Eq[]) {
    const list = live.filter((i) => i.eq === eq)
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        if (!overlap(a, b)) continue
        if (eq === 'fryer' && a.recipe?.id !== b.recipe?.id) out.push({ a, b, reason: 'Only one fryer' })
        if ((eq === 'oven' || eq === 'smoker') && a.temp && b.temp && a.temp !== b.temp)
          out.push({ a, b, reason: `${eq === 'oven' ? 'Oven' : 'Smoker'} at ${a.temp}°F and ${b.temp}°F at once` })
      }
    }
  }
  // Oven racks: at any moment, more than three dishes in the oven is a clash.
  const racks = live.filter((i) => i.eq === 'oven' && usesRack(i))
  const seen = new Set<string>()
  for (const s of racks) {
    const t = s.start
    const inside = racks.filter((i) => i.start <= t && t < i.end)
    if (inside.length <= OVEN_RACKS) continue
    const sig = inside.map((i) => i.key).sort().join('|')
    if (seen.has(sig)) continue
    seen.add(sig)
    out.unshift({ a: inside[0], b: inside[1], all: inside, reason: `${inside.length} dishes but only ${OVEN_RACKS} oven racks` })
  }
  return out
}

export function dayKey(d: Date): string {
  return tzDayKey(d)
}
