const COLORS = ['#e8742a', '#c0392b', '#f2b632', '#6a994e', '#8a4b2a', '#fff3d6']
const SHAPES = ['🍂', '🍁', '', '', '', '']

export function confetti(count = 36): void {
  const box = document.createElement('div')
  box.className = 'confetti'
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span')
    const shape = SHAPES[i % SHAPES.length]
    p.textContent = shape
    if (!shape) p.style.background = COLORS[i % COLORS.length]
    p.style.left = `${Math.random() * 100}%`
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 220}px`)
    p.style.setProperty('--rot', `${(Math.random() - 0.5) * 1080}deg`)
    p.style.animationDelay = `${Math.random() * 0.25}s`
    p.style.animationDuration = `${1.4 + Math.random() * 1}s`
    box.appendChild(p)
  }
  document.body.appendChild(box)
  window.setTimeout(() => box.remove(), 2800)
}
