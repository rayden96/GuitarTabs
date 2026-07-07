import type { FretShape } from '../types'

/** Classic vertical chord diagram (low E on the left), rendered as SVG. */
export default function ChordDiagram({ shape, size = 64 }: { shape: FretShape; size?: number }) {
  const W = 60
  const H = 76
  const left = 10
  const right = 54
  const top = 16
  const rowH = 11
  const colW = (right - left) / 5
  const base = shape.baseFret

  const dots: { x: number; y: number; finger: number | null }[] = []
  const marks: { x: number; label: 'o' | 'x' }[] = []
  shape.frets.forEach((cell, s) => {
    const x = left + s * colW
    if (cell === 'x') marks.push({ x, label: 'x' })
    else if (cell === 0) marks.push({ x, label: 'o' })
    else if (typeof cell === 'number') {
      const rel = cell - base + 1
      if (rel >= 1 && rel <= 5) {
        dots.push({ x, y: top + (rel - 0.5) * rowH, finger: shape.fingers[s] ?? null })
      }
    }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={size} height={(size * H) / W} aria-hidden>
      {/* frets */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={left} x2={right} y1={top + i * rowH} y2={top + i * rowH} stroke="var(--color-zinc-600)" strokeWidth={i === 0 && base === 1 ? 3 : 1} />
      ))}
      {/* strings */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={left + i * colW} x2={left + i * colW} y1={top} y2={top + 5 * rowH} stroke="var(--color-zinc-600)" strokeWidth={1} />
      ))}
      {base > 1 && (
        <text x={2} y={top + rowH - 3} fontSize={7.5} fill="var(--color-zinc-400)">
          {base}
        </text>
      )}
      {marks.map((m, i) => (
        <text key={i} x={m.x} y={top - 4} fontSize={8} textAnchor="middle" fill={m.label === 'o' ? 'var(--color-zinc-300)' : 'var(--color-zinc-500)'}>
          {m.label}
        </text>
      ))}
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={4.4} fill="var(--color-amber-400)" />
          {d.finger != null && (
            <text x={d.x} y={d.y + 2.6} fontSize={7} textAnchor="middle" fill="var(--color-zinc-950)" fontWeight={700}>
              {d.finger}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
