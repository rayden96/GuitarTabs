import { Fragment } from 'react'
import type { Cell, Section, Step } from '../types'
import { STRING_NAMES } from '../types'

function cellText(c: Cell): string | null {
  if (c === null) return null
  return c === 'x' ? '×' : String(c)
}

function StepBlock({
  step,
  current,
  selected,
  onClick,
}: {
  step: Step
  current: boolean
  selected: boolean
  onClick?: () => void
}) {
  const isChord = step.content.kind === 'chord'
  const columns: Cell[][] = isChord
    ? [step.content.kind === 'chord' ? step.content.shape.frets : []]
    : (step.content.kind === 'tab' ? step.content.columns.map((c) => c.cells) : [])
  const colW = 26
  const minWidth = Math.max(columns.length * colW + 8, 34 + (step.beats - 1) * 18)
  const isEmpty = columns.every((col) => col.every((c) => c === null))

  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      data-step-id={step.id}
      onClick={onClick}
      className={`relative flex shrink-0 flex-col px-0.5 ${selected ? 'rounded-md ring-1 ring-amber-400' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ minWidth }}
    >
      <div className={`h-5 truncate text-center text-xs font-semibold ${current ? 'text-amber-300' : 'text-zinc-300'}`}>
        {isChord ? (step.content as { name: string }).name : ''}
      </div>
      {Array.from({ length: 6 }, (_, row) => {
        const s = 5 - row // high e on top
        return (
          <div
            key={row}
            className="string-line grid h-[22px]"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(${colW}px, 1fr))` }}
          >
            {columns.map((col, ci) => {
              const text = cellText(col[s])
              return (
                <span key={ci} className="flex items-center justify-center">
                  {text !== null && (
                    <span
                      className={`bg-zinc-950 px-0.5 font-mono text-[13px] leading-none ${current ? 'text-amber-300' : 'text-zinc-100'}`}
                    >
                      {text}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        )
      })}
      {isEmpty && !isChord && (
        <div className="pointer-events-none absolute inset-x-1 top-5 bottom-0 rounded border border-dashed border-zinc-700/60" />
      )}
      {current && <div className="absolute inset-x-1 -bottom-1.5 h-1 rounded-full bg-amber-400" />}
    </Tag>
  )
}

/**
 * Renders one section's steps as 6-line tab notation with bar lines.
 * Used read-only in the player and interactively in the editor.
 */
export default function TabNotation({
  section,
  beatsPerBar,
  currentStepId = null,
  selectedStepId = null,
  onStepClick,
  showStringNames = true,
}: {
  section: Section
  beatsPerBar: number
  currentStepId?: string | null
  selectedStepId?: string | null
  onStepClick?: (step: Step) => void
  showStringNames?: boolean
}) {
  let cum = 0
  return (
    <div className="no-scrollbar flex items-start overflow-x-auto pb-2">
      {showStringNames && (
        <div className="sticky left-0 z-10 mr-1 shrink-0 bg-zinc-950 pr-1">
          <div className="h-5" />
          {Array.from({ length: 6 }, (_, row) => (
            <div key={row} className="flex h-[22px] items-center font-mono text-[10px] text-zinc-600">
              {STRING_NAMES[5 - row]}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start">
        {section.steps.map((step) => {
          const atBarStart = cum > 0 && cum % beatsPerBar === 0
          cum += step.beats
          return (
            <Fragment key={step.id}>
              {atBarStart && (
                <div className="mx-0.5 shrink-0">
                  <div className="h-5" />
                  <div className="h-[132px] w-px bg-zinc-600" />
                </div>
              )}
              <StepBlock
                step={step}
                current={step.id === currentStepId}
                selected={step.id === selectedStepId}
                onClick={onStepClick ? () => onStepClick(step) : undefined}
              />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
