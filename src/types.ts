// String index convention everywhere: 0 = low E (6th string) … 5 = high e (1st string).
// Tab views render index 5 (high e) on the top line, matching standard tab notation.

/** A note cell: fret number (0 = open), 'x' = muted hit, null = string not played. */
export type Cell = number | 'x' | null

export interface FretShape {
  frets: Cell[] // length 6
  fingers: (number | null)[] // length 6, values 1–4, null = unmarked
  /** First fret of the displayed window; frets[] holds absolute fret numbers. */
  baseFret: number
}

export interface ChordContent {
  kind: 'chord'
  name: string
  shape: FretShape
}

export interface TabColumn {
  id: string
  cells: Cell[] // length 6
}

export interface TabContent {
  kind: 'tab'
  columns: TabColumn[]
}

export type StepContent = ChordContent | TabContent

export interface Step {
  id: string
  /** Duration in beats. Default = one full bar. */
  beats: number
  content: StepContent
}

export type Stroke = 'D' | 'U' | '-' | 'x'

export interface StrummingPattern {
  /** 2 = eighth notes, 4 = sixteenth notes */
  subdivisionsPerBeat: 2 | 4
  /** length = timeSignature.beats * subdivisionsPerBeat */
  strokes: Stroke[]
}

export interface Section {
  id: string
  name: string
  strummingPattern: StrummingPattern | null
  steps: Step[]
  /** How many times this section plays back-to-back (absent = 1, kept optional for older songs). */
  repeats?: number
}

export interface TimeSignature {
  beats: number
  unit: number
}

export interface Song {
  id: string
  title: string
  artist: string
  folderId: string | null
  tempo: number
  timeSignature: TimeSignature
  capo: number
  sections: Section[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Folder {
  id: string
  name: string
  sortOrder: number
  updatedAt: string
  deletedAt: string | null
}

export interface UserChord {
  id: string
  name: string
  shape: FretShape
}

/** Dexie records carry a dirty flag (1 = has local changes not yet pushed). */
export type SongRecord = Song & { dirty: 0 | 1 }
export type FolderRecord = Folder & { dirty: 0 | 1 }

export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'] as const
export const NUM_STRINGS = 6
export const EMPTY_CELLS: Cell[] = [null, null, null, null, null, null]
