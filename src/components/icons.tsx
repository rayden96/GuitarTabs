import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

function Base({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export const PlayIcon = (p: P) => (
  <Base {...p}>
    <path d="M6 4.5v15l13-7.5-13-7.5Z" fill="currentColor" stroke="none" />
  </Base>
)
export const PauseIcon = (p: P) => (
  <Base {...p}>
    <rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor" stroke="none" />
  </Base>
)
export const PencilIcon = (p: P) => (
  <Base {...p}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
  </Base>
)
export const TrashIcon = (p: P) => (
  <Base {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Base>
)
export const PlusIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)
export const FolderIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
  </Base>
)
export const DotsIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
  </Base>
)
export const BackIcon = (p: P) => (
  <Base {...p}>
    <path d="M15 19 8 12l7-7" />
  </Base>
)
export const ChevronIcon = (p: P) => (
  <Base {...p}>
    <path d="m9 6 6 6-6 6" />
  </Base>
)
export const CloseIcon = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
)
export const LoopIcon = (p: P) => (
  <Base {...p}>
    <path d="M17 2v4H7a4 4 0 0 0-4 4v1m4 11v-4h10a4 4 0 0 0 4-4v-1M17 2l3 3-3 3M7 22l-3-3 3-3" />
  </Base>
)
export const MetronomeIcon = (p: P) => (
  <Base {...p}>
    <path d="M9 3h6l3.5 17h-13L9 3Z" />
    <path d="m12 13 6-8" />
    <circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none" />
  </Base>
)
export const CloudIcon = (p: P) => (
  <Base {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 18.3 10.6 3.8 3.8 0 0 1 17.5 18H7Z" />
  </Base>
)
export const CloudCheckIcon = (p: P) => (
  <Base {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 18.3 10.6 3.8 3.8 0 0 1 17.5 18H7Z" />
    <path d="m9.5 13.5 2 2 3.5-4" />
  </Base>
)
export const CloudOffIcon = (p: P) => (
  <Base {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 18.3 10.6 3.8 3.8 0 0 1 17.5 18H7Z" />
    <path d="m4 4 16 16" />
  </Base>
)
export const KeyIcon = (p: P) => (
  <Base {...p}>
    <circle cx="8" cy="14" r="4" />
    <path d="m11 11 8-8m-3 3 3 3" />
  </Base>
)
export const MusicIcon = (p: P) => (
  <Base {...p}>
    <path d="M9 18V6l10-2v11.5" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="15.5" r="2.5" />
  </Base>
)
export const CopyIcon = (p: P) => (
  <Base {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Base>
)
export const ArrowUpIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 19V5m-6 6 6-6 6 6" />
  </Base>
)
export const ArrowDownIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14m-6-6 6 6 6-6" />
  </Base>
)
export const SearchIcon = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
)
export const SpinnerIcon = (p: P) => (
  <Base {...p} className={`animate-spin ${p.className ?? ''}`}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </Base>
)
