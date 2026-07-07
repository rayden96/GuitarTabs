import { useState } from 'react'
import type { Cell, TabContent } from '../types'
import { STRING_NAMES } from '../types'
import { newId } from '../lib/id'
import { Sheet } from './ui'

/**
 * Grid editor for a manual-tab step: columns are played left→right, each
 * column holds simultaneous notes. Tap a cell, then tap a fret number.
 * Selection auto-advances down the strings, then to the next column.
 */
export default function TabStepSheet({
  content,
  onChange,
  onClose,
}: {
  content: TabContent
  onChange: (c: TabContent) => void
  onClose: () => void
}) {
  const [sel, setSel] = useState<{ col: number; str: number }>({ col: 0, str: 5 })
  const cols = content.columns
  const selCol = Math.min(sel.col, cols.length - 1)

  const setCell = (value: Cell) => {
    const columns = cols.map((c, i) =>
      i === selCol ? { ...c, cells: c.cells.map((cell, s) => (s === sel.str ? value : cell)) } : c,
    )
    onChange({ ...content, columns })
    // advance: next string down, then next column from the top
    if (sel.str > 0) setSel({ col: selCol, str: sel.str - 1 })
    else if (selCol < cols.length - 1) setSel({ col: selCol + 1, str: 5 })
  }

  const addColumn = () => {
    const columns = [...cols]
    columns.splice(selCol + 1, 0, { id: newId(), cells: [null, null, null, null, null, null] })
    onChange({ ...content, columns })
    setSel({ col: selCol + 1, str: 5 })
  }

  const removeColumn = () => {
    if (cols.length <= 1) return
    const columns = cols.filter((_, i) => i !== selCol)
    onChange({ ...content, columns })
    setSel({ col: Math.max(0, selCol - 1), str: sel.str })
  }

  return (
    <Sheet title="Edit tab" onClose={onClose} wide>
      <div className="no-scrollbar mb-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="mb-1 flex">
            <div className="w-8" />
            {cols.map((c, i) => (
              <div key={c.id} className={`w-10 text-center text-[10px] font-semibold ${i === selCol ? 'text-ember' : 'text-faint'}`}>
                {i + 1}
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, row) => {
            const s = 5 - row
            return (
              <div key={s} className="flex">
                <div className="flex w-8 items-center justify-center font-mono text-xs text-faint">{STRING_NAMES[s]}</div>
                {cols.map((c, i) => {
                  const selected = i === selCol && s === sel.str
                  const v = c.cells[s]
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSel({ col: i, str: s })}
                      className={`string-line flex h-10 w-10 items-center justify-center ${selected ? 'rounded-md bg-cream ring-2 ring-wood' : ''}`}
                    >
                      {v !== null && (
                        <span className={`px-0.5 font-mono text-sm font-semibold ${selected ? 'bg-cream' : 'bg-surface'}`}>
                          {v === 'x' ? '×' : v}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: 16 }, (_, n) => (
          <button
            key={n}
            onClick={() => setCell(n)}
            className="h-10 rounded-lg bg-cream font-mono text-sm font-semibold text-ink shadow-xs hover:bg-line active:bg-wood active:text-[#fdf6e6]"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5">
        <button onClick={() => setCell('x')} className="h-10 rounded-lg bg-cream text-sm font-semibold text-ink shadow-xs hover:bg-line">
          × mute
        </button>
        <button onClick={() => setCell(null)} className="h-10 rounded-lg bg-cream text-sm font-semibold text-ink shadow-xs hover:bg-line">
          clear
        </button>
        <button onClick={addColumn} className="h-10 rounded-lg bg-cream text-sm font-semibold text-ink shadow-xs hover:bg-line">
          + column
        </button>
        <button
          onClick={removeColumn}
          disabled={cols.length <= 1}
          className="h-10 rounded-lg bg-cream text-sm font-semibold text-ink shadow-xs hover:bg-line disabled:opacity-40"
        >
          − column
        </button>
      </div>
    </Sheet>
  )
}
