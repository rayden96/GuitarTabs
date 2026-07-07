import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'

export const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors select-none disabled:opacity-40'
export const btnGhost = `${btn} text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700`
export const btnSolid = `${btn} bg-amber-400 text-zinc-950 hover:bg-amber-300 active:bg-amber-500`
export const btnOutline = `${btn} border border-zinc-700 text-zinc-200 hover:bg-zinc-800`

export const inputCls =
  'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none'

/** Bottom sheet on small screens, centered dialog on larger ones. */
export function Sheet({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:m-4 sm:rounded-2xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className={`${btnGhost} h-8 w-8`} onClick={onClose} aria-label="Close">
            <CloseIcon width={18} height={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 pb-safe">{children}</div>
      </div>
    </div>
  )
}

/** Compact +/- numeric stepper. */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  format,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  label?: string
  format?: (v: number) => string
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900">
      <button className="h-9 w-9 rounded-l-lg text-lg text-zinc-300 hover:bg-zinc-800" onClick={() => set(value - step)} aria-label={`Decrease ${label ?? ''}`}>
        −
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums">{format ? format(value) : value}</span>
      <button className="h-9 w-9 rounded-r-lg text-lg text-zinc-300 hover:bg-zinc-800" onClick={() => set(value + step)} aria-label={`Increase ${label ?? ''}`}>
        +
      </button>
    </div>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
      {children}
    </div>
  )
}
