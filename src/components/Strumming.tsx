import type { StrummingPattern, Stroke } from '../types'
import { resizePattern, subdivisionLabel } from '../lib/songUtils'
import { ArrowDownIcon, ArrowUpIcon } from './icons'

// tap-cycle order: empty slot becomes a down-strum on the first tap
const CYCLE: Stroke[] = ['-', 'D', 'U', 'x']

function StrokeGlyph({ stroke, active = false, size = 18 }: { stroke: Stroke; active?: boolean; size?: number }) {
  const cls = active ? 'text-ember' : stroke === '-' ? 'text-faint' : 'text-ink'
  if (stroke === 'D') return <ArrowDownIcon className={cls} width={size} height={size} strokeWidth={2.4} />
  if (stroke === 'U') return <ArrowUpIcon className={cls} width={size} height={size} strokeWidth={2.4} />
  if (stroke === 'x')
    return <span className={`font-bold ${active ? 'text-ember' : 'text-soft'}`} style={{ fontSize: size * 0.85 }}>×</span>
  return <span className={cls} style={{ fontSize: size * 0.85 }}>·</span>
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
        <span className="text-xs text-soft">Resolution</span>
        {([2, 4] as const).map((r) => (
          <button
            key={r}
            onClick={() => onChange(resizePattern(pattern, beatsPerBar, r))}
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              pattern.subdivisionsPerBeat === r ? 'bg-wood text-[#fdf6e6]' : 'bg-cream text-soft hover:bg-line'
            }`}
          >
            {r === 2 ? '8ths' : '16ths'}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-faint sm:inline">tap to cycle ↓ ↑ · ×</span>
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto">
        {pattern.strokes.map((stroke, i) => (
          <button
            key={i}
            onClick={() => cycle(i)}
            className={`flex min-w-9 flex-1 flex-col items-center rounded-lg py-1.5 ${
              i % pattern.subdivisionsPerBeat === 0 ? 'bg-cream' : 'bg-cream/45'
            } hover:bg-line`}
          >
            <span className="flex h-6 items-center">
              <StrokeGlyph stroke={stroke} />
            </span>
            <span className="text-[10px] text-faint">{subdivisionLabel(i, pattern.subdivisionsPerBeat)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Read-only strumming display with a live position highlight (player). */
export function StrumDisplay({
  pattern,
  activeIndex,
  large = false,
}: {
  pattern: StrummingPattern
  activeIndex: number | null
  large?: boolean
}) {
  return (
    <div className={`no-scrollbar flex justify-center overflow-x-auto ${large ? 'gap-1.5' : 'gap-1'}`}>
      {pattern.strokes.map((stroke, i) => {
        const active = i === activeIndex
        return (
          <div
            key={i}
            className={`flex flex-col items-center rounded-xl transition-transform ${
              large ? 'min-w-10 px-1 py-1.5' : 'min-w-8 py-1'
            } ${active ? 'scale-110 bg-cream shadow-xs' : ''}`}
          >
            <span className={`flex items-center ${large ? 'h-8' : 'h-6'}`}>
              <StrokeGlyph stroke={stroke} active={active} size={large ? 27 : 18} />
            </span>
            <span className={`${large ? 'text-xs' : 'text-[10px]'} ${active ? 'font-semibold text-ember' : 'text-faint'}`}>
              {subdivisionLabel(i, pattern.subdivisionsPerBeat)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
