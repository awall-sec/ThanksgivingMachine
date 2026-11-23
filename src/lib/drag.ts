import { useEffect, useRef, useState } from 'react'

/** Where the pointer is while dragging a step: over a day tab, over another step, or nowhere special. */
export type DropTarget = { day: string } | { taskKey: string } | null

export interface DragState {
  key: string
  dx: number
  x: number
  y: number
  target: DropTarget
}

function targetAt(x: number, y: number): DropTarget {
  const el = document.elementFromPoint(x, y)?.closest('[data-drop-day],[data-drop-task]') as HTMLElement | null
  if (!el) return null
  if (el.dataset.dropDay) return { day: el.dataset.dropDay }
  return { taskKey: el.dataset.dropTask! }
}

let touchDragging = false
if (typeof document !== 'undefined') {
  // Once a touch drag has started, stop the page from scrolling under the finger.
  document.addEventListener('touchmove', (e) => { if (touchDragging) e.preventDefault() }, { passive: false })
}

/**
 * Pointer-based drag (works for mouse and touch). Mouse drags start after moving a few pixels;
 * touch drags start after holding still for a moment so normal scrolling still works.
 */
export function usePointerDrag(onDrop: (key: string, dx: number, target: DropTarget) => void) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const justDragged = useRef(false)
  const dropRef = useRef(onDrop)
  dropRef.current = onDrop

  useEffect(() => () => { touchDragging = false }, [])

  const start = (e: React.PointerEvent, key: string, immediate = false) => {
    if (e.button !== 0) return
    const sx = e.clientX
    const sy = e.clientY
    const touch = e.pointerType !== 'mouse' && !immediate
    let active = false
    let last: DragState = { key, dx: 0, x: sx, y: sy, target: null }
    const activate = () => {
      active = true
      touchDragging = touch
      navigator.vibrate?.(15)
      setDrag(last)
    }
    const hold = touch ? window.setTimeout(activate, 300) : 0
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      if (!active) {
        if (touch) { if (Math.hypot(dx, dy) > 8) cleanup() } // finger moved first: it's a scroll
        else if (Math.hypot(dx, dy) > 5) activate()
        if (!active) return
      }
      last = { key, dx, x: ev.clientX, y: ev.clientY, target: targetAt(ev.clientX, ev.clientY) }
      setDrag(last)
    }
    const up = () => {
      const wasActive = active
      cleanup()
      if (!wasActive) return
      justDragged.current = true
      setTimeout(() => { justDragged.current = false }, 50)
      dropRef.current(key, last.dx, last.target)
    }
    const cleanup = () => {
      clearTimeout(hold)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      touchDragging = false
      active = false
      setDrag(null)
    }
    const cancel = () => cleanup()
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
  }

  return { drag, start, wasDrag: () => justDragged.current }
}

/** Whole days between two YYYY-MM-DD keys. */
export function dayDiff(from: string, to: string): number {
  const d = (k: string) => { const [y, m, dd] = k.split('-').map(Number); return Date.UTC(y, m - 1, dd) }
  return Math.round((d(to) - d(from)) / 86400000)
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
