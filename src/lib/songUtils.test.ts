import { describe, expect, it } from 'vitest'
import { buildTimeline, resizePattern, sectionBeatRange, stepAtBeat, subdivisionLabel } from './songUtils'
import { newSong, newSection } from './repo'
import type { Song, Step, StrummingPattern } from '../types'

const chordStep = (id: string, beats: number): Step => ({
  id,
  beats,
  content: { kind: 'chord', name: 'C', shape: { frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null], baseFret: 1 } },
})

function songWith(stepsA: Step[], stepsB: Step[] = []): Song {
  const song = newSong()
  song.sections = [newSection('A'), newSection('B')]
  song.sections[0].steps = stepsA
  song.sections[1].steps = stepsB
  return song
}

describe('buildTimeline', () => {
  it('accumulates beats across sections', () => {
    const song = songWith([chordStep('a1', 4), chordStep('a2', 2)], [chordStep('b1', 4)])
    const tl = buildTimeline(song)
    expect(tl.totalBeats).toBe(10)
    expect(tl.steps.map((s) => s.startBeat)).toEqual([0, 4, 6])
    expect(tl.steps[2].sectionIndex).toBe(1)
  })

  it('is empty for a song with no steps', () => {
    const tl = buildTimeline(songWith([]))
    expect(tl.totalBeats).toBe(0)
    expect(tl.steps).toHaveLength(0)
  })

  it('expands section repeats into consecutive passes', () => {
    const song = songWith([chordStep('a1', 4)], [chordStep('b1', 2)])
    song.sections[0].repeats = 3
    const tl = buildTimeline(song)
    expect(tl.totalBeats).toBe(14) // 4×3 + 2
    expect(tl.steps.map((s) => s.startBeat)).toEqual([0, 4, 8, 12])
    expect(tl.steps.map((s) => s.repeatIndex)).toEqual([0, 1, 2, 0])
    // every pass points at the same editor step
    expect(new Set(tl.steps.slice(0, 3).map((s) => s.stepId)).size).toBe(1)
    expect(stepAtBeat(tl, 5)?.repeatIndex).toBe(1)
    expect(stepAtBeat(tl, 13)?.sectionIndex).toBe(1)
  })

  it('treats missing or invalid repeats as 1', () => {
    const song = songWith([chordStep('a1', 4)])
    song.sections[0].repeats = 0
    expect(buildTimeline(song).totalBeats).toBe(4)
    delete song.sections[0].repeats
    expect(buildTimeline(song).totalBeats).toBe(4)
  })
})

describe('stepAtBeat', () => {
  const tl = buildTimeline(songWith([chordStep('a1', 4), chordStep('a2', 2)]))

  it('finds the step containing a beat, half-open interval', () => {
    expect(stepAtBeat(tl, 0)?.stepId).toBe('a1')
    expect(stepAtBeat(tl, 3.99)?.stepId).toBe('a1')
    expect(stepAtBeat(tl, 4)?.stepId).toBe('a2')
    expect(stepAtBeat(tl, 5.5)?.stepId).toBe('a2')
  })

  it('returns null before zero and past the end', () => {
    expect(stepAtBeat(tl, -1)).toBeNull()
    expect(stepAtBeat(tl, 6)).toBeNull()
  })
})

describe('sectionBeatRange', () => {
  it('covers only the section steps', () => {
    const song = songWith([chordStep('a1', 4)], [chordStep('b1', 2), chordStep('b2', 2)])
    const tl = buildTimeline(song)
    expect(sectionBeatRange(tl, song.sections[1].id)).toEqual({ start: 4, end: 8 })
    expect(sectionBeatRange(tl, 'nope')).toBeNull()
  })
})

describe('resizePattern', () => {
  it('doubles resolution keeping strokes on the beat grid', () => {
    const p: StrummingPattern = { subdivisionsPerBeat: 2, strokes: ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'] }
    const r = resizePattern(p, 4, 4)
    expect(r.strokes).toHaveLength(16)
    expect(r.strokes[0]).toBe('D') // beat 1
    expect(r.strokes[2]).toBe('-') // & of 1
    expect(r.strokes[4]).toBe('D') // beat 2
    expect(r.strokes[6]).toBe('U') // & of 2
  })

  it('shrinks to fewer beats per bar', () => {
    const p: StrummingPattern = { subdivisionsPerBeat: 2, strokes: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'] }
    const r = resizePattern(p, 3, 2)
    expect(r.strokes).toHaveLength(6)
    expect(r.strokes[0]).toBe('D')
  })
})

describe('subdivisionLabel', () => {
  it('labels eighths as 1 & 2 &', () => {
    expect([0, 1, 2, 3].map((i) => subdivisionLabel(i, 2))).toEqual(['1', '&', '2', '&'])
  })
  it('labels sixteenths as 1 e & a', () => {
    expect([0, 1, 2, 3, 4].map((i) => subdivisionLabel(i, 4))).toEqual(['1', 'e', '&', 'a', '2'])
  })
})
