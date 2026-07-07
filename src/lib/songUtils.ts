import type { Song, Section, Step, StrummingPattern, Stroke } from '../types'

export interface TimelineStep {
  sectionId: string
  sectionIndex: number
  stepId: string
  stepIndex: number
  startBeat: number
  beats: number
}

export interface Timeline {
  steps: TimelineStep[]
  totalBeats: number
}

/** Flatten a song's sections/steps into a beat timeline. */
export function buildTimeline(song: Song): Timeline {
  const steps: TimelineStep[] = []
  let beat = 0
  song.sections.forEach((section, sectionIndex) => {
    section.steps.forEach((step, stepIndex) => {
      steps.push({
        sectionId: section.id,
        sectionIndex,
        stepId: step.id,
        stepIndex,
        startBeat: beat,
        beats: step.beats,
      })
      beat += step.beats
    })
  })
  return { steps, totalBeats: beat }
}

/** The timeline step active at a (possibly fractional) beat position, or null. */
export function stepAtBeat(timeline: Timeline, beat: number): TimelineStep | null {
  if (beat < 0) return null
  for (const s of timeline.steps) {
    if (beat >= s.startBeat && beat < s.startBeat + s.beats) return s
  }
  return null
}

/** Beat range [start, end) covered by a section, or null if the section has no steps. */
export function sectionBeatRange(timeline: Timeline, sectionId: string): { start: number; end: number } | null {
  const steps = timeline.steps.filter((s) => s.sectionId === sectionId)
  if (steps.length === 0) return null
  const start = steps[0].startBeat
  const last = steps[steps.length - 1]
  return { start, end: last.startBeat + last.beats }
}

export function defaultPattern(beatsPerBar: number): StrummingPattern {
  const strokes: Stroke[] = []
  for (let i = 0; i < beatsPerBar * 2; i++) strokes.push(i % 2 === 0 ? 'D' : '-')
  return { subdivisionsPerBeat: 2, strokes }
}

/** Resize/convert a pattern when beats-per-bar or resolution changes, preserving stroke positions. */
export function resizePattern(
  pattern: StrummingPattern,
  beatsPerBar: number,
  subdivisionsPerBeat: 2 | 4,
): StrummingPattern {
  const target = beatsPerBar * subdivisionsPerBeat
  const strokes: Stroke[] = new Array(target).fill('-')
  for (let i = 0; i < pattern.strokes.length; i++) {
    const beatPos = i / pattern.subdivisionsPerBeat
    const j = Math.round(beatPos * subdivisionsPerBeat)
    if (j < target && strokes[j] === '-') strokes[j] = pattern.strokes[i]
  }
  return { subdivisionsPerBeat, strokes }
}

/** Label for a subdivision slot: 1 & 2 & … (8ths) or 1 e & a … (16ths). */
export function subdivisionLabel(index: number, subdivisionsPerBeat: 2 | 4): string {
  const beat = Math.floor(index / subdivisionsPerBeat) + 1
  const sub = index % subdivisionsPerBeat
  if (subdivisionsPerBeat === 2) return sub === 0 ? String(beat) : '&'
  return sub === 0 ? String(beat) : sub === 1 ? 'e' : sub === 2 ? '&' : 'a'
}

/** Bar boundaries (in beats-from-section-start) for rendering bar lines inside a section. */
export function sectionBarOffsets(section: Section, beatsPerBar: number): number[] {
  const total = section.steps.reduce((sum, s) => sum + s.beats, 0)
  const offsets: number[] = []
  for (let b = beatsPerBar; b < total; b += beatsPerBar) offsets.push(b)
  return offsets
}

export function stepLabel(step: Step): string {
  return step.content.kind === 'chord' ? step.content.name : 'tab'
}
