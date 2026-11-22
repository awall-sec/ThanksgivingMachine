// Synthesized "gobble" alarm (no audio files). Browsers need one user tap before sound can play.
let ctx: AudioContext | null = null
let loop: number | undefined

export function unlockAudio(): boolean {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return true
  } catch {
    return false
  }
}

export function audioReady(): boolean {
  return !!ctx && ctx.state === 'running'
}

export function gobble(): void {
  if (!ctx) return
  const t0 = ctx.currentTime + 0.02
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2200
  filter.connect(ctx.destination)
  for (let i = 0; i < 6; i++) {
    const t = t0 + i * 0.1
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(620 + (i % 2) * 120, t)
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.085)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(g).connect(filter)
    osc.start(t)
    osc.stop(t + 0.1)
  }
  // Ding-ding bell after the gobble
  for (const [i, f] of [880, 1320, 880, 1320].entries()) {
    const t = t0 + 0.75 + i * 0.18
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    osc.connect(g).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  }
}

function buzz() {
  try {
    navigator.vibrate?.([300, 120, 300, 120, 300])
  } catch {
    /* not supported */
  }
}

export function startRinging(): void {
  if (loop) return
  gobble()
  buzz()
  loop = window.setInterval(() => {
    gobble()
    buzz()
  }, 2200)
}

export function stopRinging(): void {
  if (loop) window.clearInterval(loop)
  loop = undefined
}
