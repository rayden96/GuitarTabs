import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Song } from '../types'
import { getSong } from '../lib/repo'
import { buildTimeline, sectionBeatRange, stepAtBeat } from '../lib/songUtils'
import { PlaybackEngine } from '../lib/metronome'
import { keepAwake } from '../lib/wakeLock'
import TabNotation from '../components/TabNotation'
import { StrumDisplay } from '../components/Strumming'
import { BackIcon, LoopIcon, MetronomeIcon, PauseIcon, PencilIcon, PlayIcon } from '../components/icons'
import { btnGhost } from '../components/ui'

export default function SongPlay() {
  const { id } = useParams<{ id: string }>()
  const [song, setSong] = useState<Song | null>(null)
  const [missing, setMissing] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState<number | null>(null)
  const [strumIndex, setStrumIndex] = useState<number | null>(null)
  const [tempo, setTempo] = useState(100)
  const [metroOn, setMetroOn] = useState(true)
  const [countIn, setCountIn] = useState(true)
  const [showStrum, setShowStrum] = useState(true)
  const [loopSectionId, setLoopSectionId] = useState<string | null>(null)

  const engineRef = useRef<PlaybackEngine | null>(null)
  const tempoRef = useRef(tempo)
  const metroRef = useRef(metroOn)
  const loopRef = useRef<{ start: number; end: number } | null>(null)
  const pausedBeatRef = useRef<number | null>(null)

  const timeline = useMemo(() => (song ? buildTimeline(song) : null), [song])

  useEffect(() => {
    if (!id) return
    void getSong(id).then((rec) => {
      if (!rec) return setMissing(true)
      const { dirty: _d, ...s } = rec
      setSong(s)
      setTempo(s.tempo)
      tempoRef.current = s.tempo
    })
  }, [id])

  useEffect(() => {
    tempoRef.current = tempo
  }, [tempo])
  useEffect(() => {
    metroRef.current = metroOn
  }, [metroOn])
  useEffect(() => {
    loopRef.current = timeline && loopSectionId ? sectionBeatRange(timeline, loopSectionId) : null
  }, [timeline, loopSectionId])

  // stop everything when leaving the page
  useEffect(
    () => () => {
      engineRef.current?.stop()
      keepAwake(false)
    },
    [],
  )

  const stop = (keepPosition = false) => {
    engineRef.current?.stop()
    setIsPlaying(false)
    setStrumIndex(null)
    keepAwake(false)
    if (!keepPosition) {
      setCurrentBeat(null)
      pausedBeatRef.current = null
    }
  }

  const play = () => {
    if (!song || !timeline || timeline.totalBeats === 0) return
    const engine = (engineRef.current ??= new PlaybackEngine())
    let from = pausedBeatRef.current ?? 0
    const loop = loopRef.current
    if (loop && (from < loop.start || from >= loop.end)) from = loop.start
    engine.start(
      {
        getTempo: () => tempoRef.current,
        beatsPerBar: song.timeSignature.beats,
        countInBars: countIn ? 1 : 0,
        totalBeats: timeline.totalBeats,
        getLoop: () => loopRef.current,
        getMetronomeOn: () => metroRef.current,
        onBeat: (beat) => {
          setCurrentBeat(beat)
          if (beat >= 0) pausedBeatRef.current = beat
        },
        onEnd: () => stop(),
      },
      from,
    )
    setIsPlaying(true)
    keepAwake(true)
  }

  const pause = () => stop(true)

  // sub-beat strumming animation driven by the audio clock
  useEffect(() => {
    if (!isPlaying || !song || !timeline) return
    let last = -1
    const tick = () => {
      const pos = engineRef.current?.position()
      if (pos != null && pos >= 0) {
        const tlStep = stepAtBeat(timeline, pos)
        const section = tlStep ? song.sections.find((s) => s.id === tlStep.sectionId) : null
        const pattern = section?.strummingPattern
        if (pattern) {
          const beatInBar = pos % song.timeSignature.beats
          const idx = Math.min(pattern.strokes.length - 1, Math.floor(beatInBar * pattern.subdivisionsPerBeat))
          if (idx !== last) {
            last = idx
            setStrumIndex(idx)
          }
        } else if (last !== -1) {
          last = -1
          setStrumIndex(null)
        }
      }
    }
    const interval = setInterval(tick, 40)
    return () => clearInterval(interval)
  }, [isPlaying, song, timeline])

  const currentTlStep = currentBeat != null && timeline ? stepAtBeat(timeline, currentBeat) : null
  const currentStepId = currentTlStep?.stepId ?? null

  // keep the active step in view
  useEffect(() => {
    if (!currentStepId || !isPlaying) return
    document
      .querySelector(`[data-step-id="${currentStepId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }, [currentStepId, isPlaying])

  if (missing)
    return (
      <div className="p-8 text-center text-zinc-400">
        Song not found.{' '}
        <Link to="/" className="text-amber-300 underline">
          Back to library
        </Link>
      </div>
    )
  if (!song || !timeline) return <div className="p-8 text-center text-zinc-500">Loading…</div>

  const beatsPerBar = song.timeSignature.beats
  const currentSection = currentTlStep ? song.sections.find((s) => s.id === currentTlStep.sectionId) : null
  const displaySection = currentSection?.strummingPattern
    ? currentSection
    : (song.sections.find((s) => s.strummingPattern) ?? null)
  const displayPattern =
    (currentSection?.strummingPattern ?? (isPlaying ? null : displaySection?.strummingPattern)) || null
  const beatDot = currentBeat != null ? ((Math.floor(currentBeat) % beatsPerBar) + beatsPerBar) % beatsPerBar : null

  return (
    <div className="px-4 pb-64 pt-safe">
      <header className="flex items-center gap-2 py-3">
        <Link to="/" className={`${btnGhost} h-10 w-10`} aria-label="Back to library">
          <BackIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{song.title}</h1>
          <p className="truncate text-xs text-zinc-500">
            {song.artist && `${song.artist} · `}♩ {song.tempo}
            {song.capo > 0 && ` · Capo ${song.capo}`}
          </p>
        </div>
        <Link to={`/song/${song.id}/edit`} className={`${btnGhost} h-10 w-10`} aria-label="Edit song">
          <PencilIcon width={18} height={18} />
        </Link>
      </header>

      {timeline.totalBeats === 0 && (
        <p className="mt-12 text-center text-zinc-500">
          This song has no steps yet.{' '}
          <Link to={`/song/${song.id}/edit`} className="text-amber-300 underline">
            Add some in the editor
          </Link>
          .
        </p>
      )}

      {song.sections.map((section) => (
        <section key={section.id} className="mb-5">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-wide text-amber-300/90 uppercase">{section.name}</h2>
            {section.steps.length > 0 && (
              <button
                onClick={() => setLoopSectionId(loopSectionId === section.id ? null : section.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-md ${
                  loopSectionId === section.id ? 'bg-amber-400 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
                aria-label={`Loop ${section.name}`}
                title="Loop this section"
              >
                <LoopIcon width={14} height={14} />
              </button>
            )}
          </div>
          {section.steps.length > 0 ? (
            <TabNotation section={section} beatsPerBar={beatsPerBar} currentStepId={currentStepId} />
          ) : (
            <p className="text-xs text-zinc-600">No steps</p>
          )}
        </section>
      ))}

      {/* count-in overlay */}
      {currentBeat != null && currentBeat < 0 && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <span className="text-9xl font-black text-amber-300/90 drop-shadow-lg">{beatsPerBar + currentBeat + 1}</span>
        </div>
      )}

      {/* control panel */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pt-2 pb-safe">
          {showStrum && displayPattern && (
            <div className="border-b border-zinc-800/60 pb-2">
              <StrumDisplay pattern={displayPattern} activeIndex={isPlaying ? strumIndex : null} />
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 py-2">
            {Array.from({ length: beatsPerBar }, (_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  beatDot === i ? 'w-5 bg-amber-400' : 'w-2 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pb-1">
            <button
              className={`${btnGhost} h-11 w-11`}
              onClick={() => {
                pausedBeatRef.current = null
                if (isPlaying) {
                  stop()
                } else {
                  setCurrentBeat(null)
                }
              }}
              aria-label="Stop and rewind"
            >
              <span className="block h-3.5 w-3.5 rounded-[2px] bg-current" />
            </button>
            <button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-95 disabled:opacity-40"
              onClick={() => (isPlaying ? pause() : play())}
              disabled={timeline.totalBeats === 0}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon width={24} height={24} /> : <PlayIcon width={24} height={24} className="ml-0.5" />}
            </button>
            <button
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${metroOn ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-500 hover:bg-zinc-800'}`}
              onClick={() => setMetroOn(!metroOn)}
              aria-label="Toggle metronome"
              title="Metronome"
            >
              <MetronomeIcon />
            </button>
            <button
              className={`flex h-11 w-11 items-center justify-center rounded-lg text-xs font-bold ${countIn ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-500 hover:bg-zinc-800'}`}
              onClick={() => setCountIn(!countIn)}
              aria-label="Toggle count-in"
              title="1-bar count-in"
            >
              1·2·
            </button>
            <button
              className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold ${showStrum ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-500 hover:bg-zinc-800'}`}
              onClick={() => setShowStrum(!showStrum)}
              aria-label="Toggle strumming display"
              title="Strumming pattern"
            >
              ↓↑
            </button>
          </div>

          <div className="flex items-center gap-3 pb-2">
            <span className="w-14 text-right font-mono text-sm font-semibold tabular-nums">♩ {tempo}</span>
            <input
              type="range"
              min={40}
              max={240}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="flex-1 accent-amber-400"
              aria-label="Playback tempo"
            />
            <button
              className={`w-12 text-xs ${tempo !== song.tempo ? 'text-amber-300 hover:text-amber-200' : 'text-transparent'}`}
              onClick={() => setTempo(song.tempo)}
              disabled={tempo === song.tempo}
            >
              reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
