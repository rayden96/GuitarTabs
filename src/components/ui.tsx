import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'

export const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors select-none disabled:opacity-40'
export const btnGhost = `${btn} text-soft hover:bg-cream active:bg-line`
export const btnSolid = `${btn} btn-wood text-[#fdf6e6] shadow-sm hover:brightness-110 active:brightness-95`
export const btnOutline = `${btn} border border-line bg-surface text-ink shadow-xs hover:bg-cream`

export const inputCls =
  'rounded-lg border border-line bg-surface px-3 py-2 text-ink shadow-xs placeholder:text-faint focus:border-wood focus:outline-none'

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
      <div className="absolute inset-0 bg-ink/35" onClick={onClose} />
      <div
        className={`relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-2xl shadow-ink/20 sm:m-4 sm:rounded-2xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-base font-bold">{title}</h2>
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
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface shadow-xs">
      <button
        className="h-9 w-9 rounded-l-lg text-lg text-soft hover:bg-cream"
        onClick={() => set(value - step)}
        aria-label={`Decrease ${label ?? ''}`}
      >
        −
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums">{format ? format(value) : value}</span>
      <button
        className="h-9 w-9 rounded-r-lg text-lg text-soft hover:bg-cream"
        onClick={() => set(value + step)}
        aria-label={`Increase ${label ?? ''}`}
      >
        +
      </button>
    </div>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-string/70 px-4 py-6 text-center text-sm text-soft">
      {children}
    </div>
  )
}
