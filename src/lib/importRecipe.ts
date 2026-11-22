import { supabase } from './db'
import type { Eq, RecipeTask } from '../types'

export interface ImportedRecipe {
  title: string
  description: string
  serves: string
  prep_min: number | null
  cook_min: number | null
  ingredients: string[]
  steps: string[]
  source_url: string | null
}

/** Ask the import-recipe edge function to read a recipe page's schema.org data. */
export async function importFromLink(url: string): Promise<ImportedRecipe> {
  const { data, error } = await supabase.functions.invoke('import-recipe', { body: { url } })
  if (error) {
    // Pull the friendly message out of the function's JSON error body when there is one.
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json().catch(() => null)
      if (body?.error) throw new Error(body.error)
    }
    throw new Error("Couldn't import that link. Paste the recipe text instead.")
  }
  return data as ImportedRecipe
}

const ING_HEAD = /^(ingredients?|you(?:'|’)ll need|what you need)\b[:\s]*$/i
const STEP_HEAD = /^(instructions?|directions?|method|steps|preparation|how to make( it)?)\b[:\s]*$/i
const OTHER_HEAD = /^(notes?|nutrition|equipment|tips?|storage|video)\b/i
const LOOKS_LIKE_ING = /^([\d½¼¾⅓⅔⅛]|a (pinch|dash|handful))/i

/** Split pasted recipe text into ingredients and steps. */
export function parseRecipeText(text: string): { title: string; ingredients: string[]; steps: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^[\s•·*▢☐□\-–]+/, '').trim()).filter(Boolean)
  let mode: 'none' | 'ing' | 'step' | 'other' = 'none'
  const ingredients: string[] = []
  const steps: string[] = []
  let sawHeading = false
  for (const line of lines) {
    if (ING_HEAD.test(line)) { mode = 'ing'; sawHeading = true; continue }
    if (STEP_HEAD.test(line)) { mode = 'step'; sawHeading = true; continue }
    if (OTHER_HEAD.test(line) && line.length < 30) { mode = 'other'; continue }
    if (mode === 'ing') ingredients.push(line)
    else if (mode === 'step') steps.push(line.replace(/^(step\s*)?\d+[.):]\s*/i, ''))
  }
  if (!sawHeading) {
    for (const line of lines) {
      if (LOOKS_LIKE_ING.test(line) && line.length < 90) ingredients.push(line)
      else if (line.length > 25) steps.push(line.replace(/^(step\s*)?\d+[.):]\s*/i, ''))
    }
  }
  const first = lines[0] ?? ''
  const title = first.length < 70 && !LOOKS_LIKE_ING.test(first) && !ING_HEAD.test(first) ? first : ''
  return { title, ingredients, steps }
}

/** Guess the main appliance and oven temperature from the steps. */
export function guessEquipment(steps: string[]): { eq: Eq; temp: number | null } {
  const text = steps.join(' ').toLowerCase()
  const t = text.match(/(\d{3})\s*°?\s*(?:degrees\s*)?f\b/) ?? text.match(/(\d{3})\s*°/)
  const temp = t ? Number(t[1]) : null
  if (/\b(oven|bake|baking|roast)\b/.test(text) || (temp && temp >= 250 && temp <= 550)) return { eq: 'oven', temp: temp && temp >= 200 && temp <= 550 ? temp : 350 }
  if (/\b(simmer|boil|skillet|saucepan|stovetop|saut[eé]|pot over)\b/.test(text)) return { eq: 'stove', temp: null }
  if (/\b(refrigerat|chill)\b/.test(text)) return { eq: 'fridge', temp: null }
  return { eq: 'counter', temp: null }
}

const VERB: Record<Eq, string> = { oven: 'Bake', stove: 'Cook', fryer: 'Fry', fridge: 'Chill', counter: 'Make', microwave: 'Microwave' }

/** Day-of: ready 10 min before dinner. Day before: done Wednesday 3 PM (23 h before a 2 PM dinner). */
export function buildTasks(name: string, prep: number, cook: number, eq: Eq, temp: number | null, when: 'day' | 'before'): RecipeTask[] {
  const end = when === 'day' ? -10 : -1380
  const tasks: RecipeTask[] = []
  if (!prep && !cook) return [{ id: 'make', label: `Make ${name}`, at: end - 30, dur: 30, eq: 'counter', temp: null }]
  const cookStart = end - cook
  if (prep) tasks.push({ id: 'prep', label: `Prep ${name}`, at: cookStart - prep, dur: prep, eq: 'counter', temp: null })
  if (cook) tasks.push({ id: 'cook', label: `${VERB[eq]} ${name}`, at: cookStart, dur: cook, eq, temp: eq === 'oven' ? temp : null })
  return tasks
}
