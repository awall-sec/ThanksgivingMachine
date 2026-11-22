import { createClient } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import cfg from '../config.json'
import type { DB, TableName, Tables } from '../types'

export const supabase = createClient(cfg.supabaseUrl, cfg.supabaseKey)

export const PK: { [K in TableName]: keyof Tables[K] & string } = {
  app_settings: 'id',
  dishes: 'id',
  recipes: 'id',
  tasks: 'id',
  task_state: 'task_key',
  grocery_state: 'item_key',
  grocery_extras: 'id',
  timers: 'id',
}

const TABLES = Object.keys(PK) as TableName[]

const empty = (): DB => ({
  app_settings: [], dishes: [], recipes: [], tasks: [], task_state: [], grocery_state: [], grocery_extras: [], timers: [],
})

function mergeRow<K extends TableName>(rows: Tables[K][], table: K, row: Tables[K]): Tables[K][] {
  const k = PK[table]
  const i = rows.findIndex((r) => r[k] === row[k])
  if (i === -1) return [...rows, row]
  const next = rows.slice()
  next[i] = { ...rows[i], ...row }
  return next
}

export interface LiveDB {
  db: DB
  ready: boolean
  connected: boolean
  error: string | null
  upsert: <K extends TableName>(table: K, row: Partial<Tables[K]>) => void
  remove: <K extends TableName>(table: K, key: string | number) => void
}

export function useLiveDB(): LiveDB {
  const [db, setDb] = useState<DB>(empty)
  const [ready, setReady] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dbRef = useRef(db)
  dbRef.current = db

  const loadAll = useCallback(async () => {
    const results = await Promise.all(TABLES.map((t) => supabase.from(t).select('*')))
    const next = empty()
    for (let i = 0; i < TABLES.length; i++) {
      const { data, error } = results[i]
      if (error) {
        setError(`Couldn't load ${TABLES[i]}: ${error.message}`)
        return
      }
      ;(next as Record<string, unknown[]>)[TABLES[i]] = data ?? []
    }
    setError(null)
    setDb(next)
    setReady(true)
  }, [])

  useEffect(() => {
    loadAll()
    let channel = supabase.channel('thanksgiving-live')
    for (const t of TABLES) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, (payload) => {
        setDb((prev) => {
          const k = PK[t]
          if (payload.eventType === 'DELETE') {
            const old = payload.old as Record<string, unknown>
            return { ...prev, [t]: (prev[t] as unknown as Record<string, unknown>[]).filter((r) => r[k] !== old[k]) }
          }
          return { ...prev, [t]: mergeRow(prev[t] as never[], t, payload.new as never) }
        })
      })
    }
    channel.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED')
      if (status === 'SUBSCRIBED') loadAll() // catch anything missed while disconnected
    })
    const onVis = () => document.visibilityState === 'visible' && loadAll()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      supabase.removeChannel(channel)
    }
  }, [loadAll])

  const upsert = useCallback(<K extends TableName>(table: K, row: Partial<Tables[K]>) => {
    const k = PK[table]
    const existing = (dbRef.current[table] as Tables[K][]).find((r) => r[k] === (row as Tables[K])[k])
    const merged = { ...(existing ?? {}), ...row } as Tables[K]
    setDb((prev) => ({ ...prev, [table]: mergeRow(prev[table] as Tables[K][], table, merged) }))
    supabase
      .from(table)
      .upsert(merged as never)
      .then(({ error }) => {
        if (error) {
          setError(`Save failed: ${error.message}`)
          loadAll()
        }
      })
  }, [loadAll])

  const remove = useCallback(<K extends TableName>(table: K, key: string | number) => {
    const k = PK[table]
    setDb((prev) => ({ ...prev, [table]: (prev[table] as unknown as Record<string, unknown>[]).filter((r) => r[k] !== key) }))
    supabase
      .from(table)
      .delete()
      .eq(k as string, key as never)
      .then(({ error }) => {
        if (error) {
          setError(`Delete failed: ${error.message}`)
          loadAll()
        }
      })
  }, [loadAll])

  return { db, ready, connected, error, upsert, remove }
}

export const DBContext = createContext<LiveDB | null>(null)

export function useDB(): LiveDB {
  const v = useContext(DBContext)
  if (!v) throw new Error('useDB outside provider')
  return v
}

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
