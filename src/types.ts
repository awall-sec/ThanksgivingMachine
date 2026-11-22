export type Eq = 'fryer' | 'oven' | 'stove' | 'microwave' | 'counter' | 'fridge'

export interface Settings {
  id: number
  dinner_at: string
  headcount: number
  turkey_lb: number
  updated_at?: string
}

export interface Dish {
  id: string
  name: string
  who: string | null
  category: string
  sort: number
  chosen_recipe_id: string | null
  notes: string | null
}

export interface Ingredient {
  qty: number | null
  unit: string
  item: string
}

export interface RecipeTask {
  id: string
  label: string
  at: number // minutes relative to dinner
  dur: number
  eq: Eq
  temp: number | null
}

export interface Recipe {
  id: string
  dish_id: string
  title: string
  badge: string | null
  description: string | null
  serves: string | null
  prep_min: number | null
  cook_min: number | null
  equipment: Eq | null
  temp_f: number | null
  ingredients: Ingredient[]
  steps: string[]
  tasks: RecipeTask[]
  sort: number
  source_url?: string | null
}

export interface Chore {
  id: string
  label: string
  offset_min: number
  duration_min: number
  equipment: Eq
  temp_f: number | null
  sort: number
  notes: string | null
}

export interface TaskState {
  task_key: string
  done: boolean
  shift_min: number
  updated_at?: string
}

export interface GroceryState {
  item_key: string
  checked: boolean
  store: string | null
  updated_at?: string
}

export interface GroceryExtra {
  id: string
  name: string
  qty: string | null
  store: string
  checked: boolean
  created_at?: string
}

export interface Timer {
  id: string
  label: string
  duration_sec: number
  ends_at: string | null
  remaining_sec: number | null
  status: 'running' | 'paused' | 'ringing' | 'dismissed'
  created_at?: string
}

export interface Tables {
  app_settings: Settings
  dishes: Dish
  recipes: Recipe
  tasks: Chore
  task_state: TaskState
  grocery_state: GroceryState
  grocery_extras: GroceryExtra
  timers: Timer
}

export type TableName = keyof Tables
export type DB = { [K in TableName]: Tables[K][] }
