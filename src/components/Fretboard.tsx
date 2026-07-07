import { useState } from 'react'
import type { Cell, FretShape } from '../types'
import { STRING_NAMES } from '../types'

/**
 * Interactive horizontal fretboard editor. Rows top→bottom are high e → low E
 * (matching tab notation). Tap an intersection to place/remove a note; the
 * selected finger chip is recorded with each placed note.
 */
export default function Fretboard({ shape, onChange }: { shape: FretShape; onChange: (s: FretShape) => void }) {
  const [finger, setFinger] = useState<number | null>(null)
  const windowSize = 5
  const base = shape.baseFret

  const set = (stringIdx: number, cell: Cell, f: number | null = null) => {
    const frets = [...shape.frets]
    const fingers = [...shape.fingers]
    frets[stringIdx] = cell
    fingers[stringIdx] = typeof cell === 'number' && cell > 0 ? f : null
    onChange({ ...shape, frets, fingers })
  }

  const tapFret = (stringIdx: number, fret: number) => {
    if (shape.frets[stringIdx] === fret) set(stringIdx, null)
    else set(stringIdx, fret, finger)
  }

  const shiftBase = (delta: number) => {
    onChange({ ...shape, baseFret: Math.min(20, Math.max(1, base + delta)) })
  }

  return (
    <div className="select-none">
      {/* finger picker + fret window shifter */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-soft">Finger</span>
          {[1, 2, 3, 4, null].map((f) => (
            <button
              key={String(f)}
              onClick={() => setFinger(f)}
              className={`h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                finger === f ? 'bg-wood text-[#fdf6e6]' : 'bg-cream text-soft hover:bg-line'
              }`}
            >
              {f ?? '·'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <button className="h-8 w-8 rounded-lg bg-cream text-soft hover:bg-line" onClick={() => shiftBase(-1)} aria-label="Lower fret window">
            ‹
          </button>
          <span className="min-w-14 text-center text-xs text-soft">
            fret {base}–{base + windowSize - 1}
          </span>
          <button className="h-8 w-8 rounded-lg bg-cream text-soft hover:bg-line" onClick={() => shiftBase(1)} aria-label="Raise fret window">
            ›
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `28px 56px repeat(${windowSize}, minmax(0, 1fr))` }}>
        {Array.from({ length: 6 }, (_, row) => {
          const s = 5 - row // string index (5 = high e on top)
          const cur = shape.frets[s]
          return (
            <div key={s} className="contents">
              <div className="flex h-10 items-center justify-center font-mono text-xs text-faint">{STRING_NAMES[s]}</div>
              {/* open / mute controls */}
              <div className="flex h-10 items-center justify-center gap-1">
                <button
                  onClick={() => set(s, cur === 0 ? null : 0)}
                  className={`h-7 w-6 rounded text-xs font-bold ${cur === 0 ? 'bg-emerald-600 text-white' : 'bg-cream text-soft hover:bg-line'}`}
                  aria-label={`String ${STRING_NAMES[s]} open`}
                >
                  O
                </button>
                <button
                  onClick={() => set(s, cur === 'x' ? null : 'x')}
                  className={`h-7 w-6 rounded text-xs font-bold ${cur === 'x' ? 'bg-rose-600 text-white' : 'bg-cream text-soft hover:bg-line'}`}
                  aria-label={`String ${STRING_NAMES[s]} muted`}
                >
                  ×
                </button>
              </div>
              {Array.from({ length: windowSize }, (_, w) => {
                const fret = base + w
                const active = cur === fret
                return (
                  <button
                    key={fret}
                    onClick={() => tapFret(s, fret)}
                    className={`string-line relative h-10 border-l border-string/80 ${w === windowSize - 1 ? 'border-r' : ''} ${
                      base === 1 && w === 0 ? 'border-l-[3px] border-l-wood-deep' : ''
                    }`}
                    aria-label={`String ${STRING_NAMES[s]} fret ${fret}`}
                  >
                    {active && (
                      <span className="absolute top-1/2 left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-wood text-sm font-bold text-[#fdf6e6] shadow-sm">
                        {shape.fingers[s] ?? ''}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
        {/* fret number labels */}
        <div />
        <div />
        {Array.from({ length: windowSize }, (_, w) => (
          <div key={w} className="pt-1 text-center text-xs text-faint">
            {base + w}
          </div>
        ))}
      </div>
    </div>
  )
}
