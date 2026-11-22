// Seeds (or re-seeds) the Supabase database from seed/data.mjs.
// Usage: npm run seed            -> upsert settings, dishes, recipes, chores, grocery extras (keeps picks/check-offs)
//        npm run seed -- --reset -> also wipes picks, check-offs, timers
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { settings, dishes, recipes, tasks, groceryExtras } from '../seed/data.mjs'

const cfg = JSON.parse(readFileSync(new URL('../src/config.json', import.meta.url), 'utf8'))
const db = createClient(cfg.supabaseUrl, cfg.supabaseKey)
const reset = process.argv.includes('--reset')

async function run(label, p) {
  const { error } = await p
  if (error) throw new Error(`${label}: ${error.message}`)
  console.log(`✓ ${label}`)
}

if (reset) {
  for (const [t, k] of [['task_state', 'task_key'], ['grocery_state', 'item_key'], ['timers', 'id'], ['grocery_extras', 'id']]) {
    await run(`clear ${t}`, db.from(t).delete().neq(k, '__none__'))
  }
}

// Keep the family's recipe picks when re-seeding (unless --reset).
const { data: existing } = await db.from('dishes').select('id, chosen_recipe_id')
const picks = Object.fromEntries((existing ?? []).map((d) => [d.id, d.chosen_recipe_id]))
const dishRows = dishes.map((d) => ({ ...d, chosen_recipe_id: reset ? null : picks[d.id] ?? null }))

await run('settings', db.from('app_settings').upsert(settings, { ignoreDuplicates: !reset }))
await run(`dishes (${dishRows.length})`, db.from('dishes').upsert(dishRows))
await run(`recipes (${recipes.length})`, db.from('recipes').upsert(recipes))
await run(`chores (${tasks.length})`, db.from('tasks').upsert(tasks))
await run(`grocery extras (${groceryExtras.length})`, db.from('grocery_extras').upsert(groceryExtras, { ignoreDuplicates: true }))
console.log('Done.')
