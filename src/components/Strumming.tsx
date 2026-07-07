import type { StrummingPattern, Stroke } from '../types'
import { resizePattern, subdivisionLabel } from '../lib/songUtils'
import { ArrowDownIcon, ArrowUpIcon } from './icons'

// tap-cycle order: empty slot becomes a down-strum on the first tap
const CYCLE: Stroke[] = ['-', 'D', 'U', 'x']

function StrokeGlyph({ stroke, active = false }: { stroke: Stroke; active?: boolean }) {
  const cls = active ? 'text-amber-300' : stroke === '-' ? 'text-zinc-600' : 'text-zinc-200'
  if (stroke === 'D') return <ArrowDownIcon className={cls} width={18} height={18} />
  if (stroke === 'U') return <ArrowUpIcon className={cls} width={18} height={18} />
  if (stroke === 'x') return <span className={`text-base font-bold ${active ? 'text-amber-300' : 'text-zinc-400'}`}>×</span>
  return <span className={`text-base ${cls}`}>·</span>
}

/** Tap-to-cycle strumming pattern editor. */
export function StrummingEditor({
  pattern,
  beatsPerBar,
  onChange,
}: {
  pattern: StrummingPattern
  beatsPerBar: number
  onChange: (p: StrummingPattern) => void
}) {
  const cycle = (i: number) => {
    const strokes = [...pattern.strokes]
    strokes[i] = CYCLE[(CYCLE.indexOf(strokes[i]) + 1) % CYCLE.length]
    onChange({ ...pattern, strokes })
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-zinc-500">Resolution</span>
        {([2, 4] as const).map((r) => (
          <button
            key={r}
            onClick={() => onChange(resizePattern(pattern, beatsPerBar, r))}
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              pattern.subdivisionsPerBeat === r ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {r === 2 ? '8ths' : '16ths'}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">tap to cycle ↓ ↑ · ×</span>
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {pattern.strokes.map((stroke, i) => (
          <button
            key={i}
            onClick={() => cycle(i)}
            className={`flex min-w-9 flex-1 flex-col items-center rounded-lg py-1.5 ${
              i % pattern.subdivisionsPerBeat === 0 ? 'bg-zinc-800' : 'bg-zinc-800/40'
            } hover:bg-zinc-700`}
          >
            <span className="flex h-6 items-center">
              <StrokeGlyph stroke={stroke} />
            </span>
            <span className="text-[10px] text-zinc-500">{subdivisionLabel(i, pattern.subdivisionsPerBeat)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Read-only strumming display with a live position highlight (player). */
export function StrumDisplay({ pattern, activeIndex }: { pattern: StrummingPattern; activeIndex: number | null }) {
  return (
    <div className="flex justify-center gap-1">
      {pattern.strokes.map((stroke, i) => {
        const active = i === activeIndex
        return (
          <div
            key={i}
            className={`flex min-w-8 flex-col items-center rounded-lg py-1 transition-transform ${
              active ? 'scale-110 bg-zinc-800' : ''
            }`}
          >
            <span className="flex h-6 items-center">
              <StrokeGlyph stroke={stroke} active={active} />
            </span>
            <span className={`text-[10px] ${active ? 'text-amber-300' : 'text-zinc-500'}`}>
              {subdivisionLabel(i, pattern.subdivisionsPerBeat)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
