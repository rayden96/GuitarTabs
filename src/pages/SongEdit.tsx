import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ChordContent, Song, Step, TabContent } from '../types'
import { getSong, saveSong, listFolders, newSection } from '../lib/repo'
import { newId } from '../lib/id'
import { defaultPattern, resizePattern } from '../lib/songUtils'
import TabNotation from '../components/TabNotation'
import ChordSheet from '../components/ChordSheet'
import TabStepSheet from '../components/TabStepSheet'
import { StrummingEditor } from '../components/Strumming'
import SyncIndicator from '../components/SyncIndicator'
import { Stepper, btnGhost, btnOutline, btnSolid, inputCls, EmptyHint } from '../components/ui'
import { ArrowDownIcon, ArrowUpIcon, BackIcon, CloseIcon, CopyIcon, PencilIcon, PlayIcon, PlusIcon, TrashIcon } from '../components/icons'

function TapTempo({ onTempo }: { onTempo: (bpm: number) => void }) {
  const taps = useRef<number[]>([])
  const tap = () => {
    const now = performance.now()
    const arr = taps.current
    if (arr.length > 0 && now - arr[arr.length - 1] > 2000) arr.length = 0
    arr.push(now)
    if (arr.length > 5) arr.shift()
    if (arr.length >= 2) {
      const intervals = arr.slice(1).map((t, i) => t - arr[i])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      onTempo(Math.round(Math.min(240, Math.max(40, 60000 / avg))))
    }
  }
  return (
    <button className={`${btnOutline} h-9 px-3 text-sm`} onClick={tap}>
      Tap
    </button>
  )
}

const TIME_SIGS = [
  { beats: 2, unit: 4 },
  { beats: 3, unit: 4 },
  { beats: 4, unit: 4 },
  { beats: 6, unit: 8 },
]

export default function SongEdit() {
  const { id } = useParams<{ id: string }>()
  const folders = useLiveQuery(listFolders, [], [])
  const [song, setSong] = useState<Song | null>(null)
  const [missing, setMissing] = useState(false)
  const [selected, setSelected] = useState<{ sectionId: string; stepId: string } | null>(null)
  const [chordSheet, setChordSheet] = useState<{ sectionId: string; stepId: string | null } | null>(null)
  const [tabSheet, setTabSheet] = useState<{ sectionId: string; stepId: string } | null>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Song | null>(null)

  useEffect(() => {
    if (!id) return
    void getSong(id).then((rec) => {
      if (!rec) return setMissing(true)
      const { dirty: _d, ...s } = rec
      setSong(s)
    })
  }, [id])

  // flush unsaved changes when leaving the page
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (pendingRef.current) void saveSong(pendingRef.current)
    },
    [],
  )

  const update = (fn: (draft: Song) => void) => {
    setSong((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next)
      pendingRef.current = next
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        pendingRef.current = null
        void saveSong(next)
      }, 600)
      return next
    })
  }

  if (missing)
    return (
      <div className="p-8 text-center text-zinc-400">
        Song not found.{' '}
        <Link to="/" className="text-amber-300 underline">
          Back to library
        </Link>
      </div>
    )
  if (!song) return <div className="p-8 text-center text-zinc-500">Loading…</div>

  const beatsPerBar = song.timeSignature.beats

  const findStep = (sectionId: string, stepId: string): Step | undefined =>
    song.sections.find((s) => s.id === sectionId)?.steps.find((st) => st.id === stepId)

  const selectedStep = selected ? findStep(selected.sectionId, selected.stepId) : undefined
  if (selected && !selectedStep) setSelected(null)

  const mutateStep = (sectionId: string, stepId: string, fn: (step: Step) => void) =>
    update((d) => {
      const step = d.sections.find((s) => s.id === sectionId)?.steps.find((st) => st.id === stepId)
      if (step) fn(step)
    })

  const addChord = (sectionId: string) => setChordSheet({ sectionId, stepId: null })

  const addTab = (sectionId: string) => {
    const stepId = newId()
    update((d) => {
      const sec = d.sections.find((s) => s.id === sectionId)
      if (!sec) return
      const columns = Array.from({ length: 4 }, () => ({ id: newId(), cells: [null, null, null, null, null, null] as (number | 'x' | null)[] }))
      sec.steps.push({ id: stepId, beats: beatsPerBar, content: { kind: 'tab', columns } })
    })
    setSelected({ sectionId, stepId })
    setTabSheet({ sectionId, stepId })
  }

  const applyChord = (content: ChordContent) => {
    if (!chordSheet) return
    if (chordSheet.stepId) {
      mutateStep(chordSheet.sectionId, chordSheet.stepId, (step) => {
        step.content = content
      })
    } else {
      const stepId = newId()
      update((d) => {
        const sec = d.sections.find((s) => s.id === chordSheet.sectionId)
        sec?.steps.push({ id: stepId, beats: beatsPerBar, content })
      })
      setSelected({ sectionId: chordSheet.sectionId, stepId })
    }
    setChordSheet(null)
  }

  const openStepEditor = (sectionId: string, step: Step) => {
    if (step.content.kind === 'chord') setChordSheet({ sectionId, stepId: step.id })
    else setTabSheet({ sectionId, stepId: step.id })
  }

  const moveStep = (dir: -1 | 1) => {
    if (!selected) return
    update((d) => {
      const sec = d.sections.find((s) => s.id === selected.sectionId)
      if (!sec) return
      const i = sec.steps.findIndex((st) => st.id === selected.stepId)
      const j = i + dir
      if (i < 0 || j < 0 || j >= sec.steps.length) return
      ;[sec.steps[i], sec.steps[j]] = [sec.steps[j], sec.steps[i]]
    })
  }

  const tabSheetStep = tabSheet ? findStep(tabSheet.sectionId, tabSheet.stepId) : undefined

  return (
    <div className="px-4 pb-32 pt-safe">
      <header className="flex items-center gap-2 py-3">
        <Link to="/" className={`${btnGhost} h-10 w-10`} aria-label="Back to library">
          <BackIcon />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">Edit song</h1>
        <SyncIndicator />
        <Link to={`/song/${song.id}/play`} className={`${btnSolid} h-10 gap-1.5 px-4 text-sm`}>
          <PlayIcon width={16} height={16} /> Play
        </Link>
      </header>

      {/* song meta */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <input
          className="w-full bg-transparent text-xl font-bold placeholder:text-zinc-600 focus:outline-none"
          placeholder="Song title"
          value={song.title}
          onChange={(e) => update((d) => (d.title = e.target.value))}
          onFocus={(e) => song.title === 'Untitled song' && e.target.select()}
        />
        <input
          className="mt-1 w-full bg-transparent text-sm text-zinc-400 placeholder:text-zinc-600 focus:outline-none"
          placeholder="Artist"
          value={song.artist}
          onChange={(e) => update((d) => (d.artist = e.target.value))}
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Tempo</span>
            <Stepper value={song.tempo} min={40} max={240} step={2} label="tempo" onChange={(v) => update((d) => (d.tempo = v))} />
            <TapTempo onTempo={(bpm) => update((d) => (d.tempo = bpm))} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Time</span>
            <select
              className={`${inputCls} h-9 py-0`}
              value={`${song.timeSignature.beats}/${song.timeSignature.unit}`}
              onChange={(e) => {
                const [beats, unit] = e.target.value.split('/').map(Number)
                update((d) => {
                  d.timeSignature = { beats, unit }
                  for (const sec of d.sections) {
                    if (sec.strummingPattern) sec.strummingPattern = resizePattern(sec.strummingPattern, beats, sec.strummingPattern.subdivisionsPerBeat)
                  }
                })
              }}
            >
              {TIME_SIGS.map((t) => (
                <option key={`${t.beats}/${t.unit}`}>{`${t.beats}/${t.unit}`}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Capo</span>
            <Stepper value={song.capo} min={0} max={11} label="capo" format={(v) => (v === 0 ? '—' : String(v))} onChange={(v) => update((d) => (d.capo = v))} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Folder</span>
            <select
              className={`${inputCls} h-9 max-w-40 py-0`}
              value={song.folderId ?? ''}
              onChange={(e) => update((d) => (d.folderId = e.target.value || null))}
            >
              <option value="">None</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* sections */}
      {song.sections.map((section, si) => (
        <section key={section.id} className="mb-6">
          <div className="mb-1 flex items-center gap-1">
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-bold tracking-wide text-amber-300/90 uppercase placeholder:text-zinc-600 focus:outline-none"
              value={section.name}
              placeholder="Section name"
              onChange={(e) => update((d) => (d.sections[si].name = e.target.value))}
            />
            <button className={`${btnGhost} h-8 w-8`} disabled={si === 0} onClick={() => update((d) => d.sections.splice(si - 1, 0, d.sections.splice(si, 1)[0]))} aria-label="Move section up">
              <ArrowUpIcon width={15} height={15} />
            </button>
            <button
              className={`${btnGhost} h-8 w-8`}
              disabled={si === song.sections.length - 1}
              onClick={() => update((d) => d.sections.splice(si + 1, 0, d.sections.splice(si, 1)[0]))}
              aria-label="Move section down"
            >
              <ArrowDownIcon width={15} height={15} />
            </button>
            <button
              className={`${btnGhost} h-8 w-8`}
              onClick={() =>
                update((d) => {
                  const copy = structuredClone(d.sections[si])
                  copy.id = newId()
                  copy.steps.forEach((st) => (st.id = newId()))
                  d.sections.splice(si + 1, 0, copy)
                })
              }
              aria-label="Duplicate section"
            >
              <CopyIcon width={15} height={15} />
            </button>
            <button
              className={`${btnGhost} h-8 w-8 text-rose-400/80`}
              onClick={() => {
                if (section.steps.length === 0 || confirm(`Delete section "${section.name}"?`)) {
                  update((d) => d.sections.splice(si, 1))
                }
              }}
              aria-label="Delete section"
            >
              <TrashIcon width={15} height={15} />
            </button>
          </div>

          {section.steps.length > 0 ? (
            <TabNotation
              section={section}
              beatsPerBar={beatsPerBar}
              selectedStepId={selected?.sectionId === section.id ? selected.stepId : null}
              onStepClick={(step) => {
                if (selected?.stepId === step.id) openStepEditor(section.id, step)
                else setSelected({ sectionId: section.id, stepId: step.id })
              }}
            />
          ) : (
            <EmptyHint>Empty section — add a chord or tab below</EmptyHint>
          )}

          {/* selected step toolbar */}
          {selected?.sectionId === section.id && selectedStep && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2">
              <button className={`${btnOutline} h-9 gap-1 px-3 text-sm`} onClick={() => openStepEditor(section.id, selectedStep)}>
                <PencilIcon width={14} height={14} /> Edit
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Beats</span>
                <Stepper value={selectedStep.beats} min={1} max={32} label="beats" onChange={(v) => mutateStep(section.id, selectedStep.id, (st) => (st.beats = v))} />
              </div>
              <button className={`${btnGhost} h-9 w-9`} onClick={() => moveStep(-1)} aria-label="Move step left">
                ◀
              </button>
              <button className={`${btnGhost} h-9 w-9`} onClick={() => moveStep(1)} aria-label="Move step right">
                ▶
              </button>
              <button
                className={`${btnGhost} h-9 w-9`}
                onClick={() =>
                  update((d) => {
                    const sec = d.sections.find((s) => s.id === section.id)
                    if (!sec) return
                    const i = sec.steps.findIndex((st) => st.id === selectedStep.id)
                    const copy = structuredClone(sec.steps[i])
                    copy.id = newId()
                    if (copy.content.kind === 'tab') copy.content.columns.forEach((c) => (c.id = newId()))
                    sec.steps.splice(i + 1, 0, copy)
                  })
                }
                aria-label="Duplicate step"
              >
                <CopyIcon width={15} height={15} />
              </button>
              <button
                className={`${btnGhost} h-9 w-9 text-rose-400`}
                onClick={() => {
                  update((d) => {
                    const sec = d.sections.find((s) => s.id === section.id)
                    if (!sec) return
                    sec.steps = sec.steps.filter((st) => st.id !== selectedStep.id)
                  })
                  setSelected(null)
                }}
                aria-label="Delete step"
              >
                <TrashIcon width={15} height={15} />
              </button>
              <button className={`${btnGhost} ml-auto h-9 w-9`} onClick={() => setSelected(null)} aria-label="Deselect">
                <CloseIcon width={15} height={15} />
              </button>
            </div>
          )}

          <div className="mt-2 flex gap-2">
            <button className={`${btnOutline} h-9 px-3 text-sm`} onClick={() => addChord(section.id)}>
              <PlusIcon width={14} height={14} /> Chord
            </button>
            <button className={`${btnOutline} h-9 px-3 text-sm`} onClick={() => addTab(section.id)}>
              <PlusIcon width={14} height={14} /> Tab
            </button>
            {!section.strummingPattern && (
              <button
                className={`${btnGhost} h-9 px-3 text-sm text-zinc-400`}
                onClick={() => update((d) => (d.sections[si].strummingPattern = defaultPattern(beatsPerBar)))}
              >
                <PlusIcon width={14} height={14} /> Strumming
              </button>
            )}
          </div>

          {section.strummingPattern && (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Strumming</span>
                <button
                  className="text-xs text-zinc-500 hover:text-rose-400"
                  onClick={() => update((d) => (d.sections[si].strummingPattern = null))}
                >
                  Remove
                </button>
              </div>
              <StrummingEditor
                pattern={section.strummingPattern}
                beatsPerBar={beatsPerBar}
                onChange={(p) => update((d) => (d.sections[si].strummingPattern = p))}
              />
            </div>
          )}
        </section>
      ))}

      <button
        className={`${btnOutline} w-full py-2.5`}
        onClick={() => update((d) => d.sections.push(newSection(`Section ${d.sections.length + 1}`)))}
      >
        <PlusIcon width={16} height={16} /> Add section
      </button>

      {chordSheet && (
        <ChordSheet
          initial={
            chordSheet.stepId
              ? ((findStep(chordSheet.sectionId, chordSheet.stepId)?.content as ChordContent | undefined) ?? null)
              : null
          }
          onApply={applyChord}
          onClose={() => setChordSheet(null)}
        />
      )}

      {tabSheet && tabSheetStep && tabSheetStep.content.kind === 'tab' && (
        <TabStepSheet
          content={tabSheetStep.content as TabContent}
          onChange={(c) => mutateStep(tabSheet.sectionId, tabSheet.stepId, (st) => (st.content = c))}
          onClose={() => setTabSheet(null)}
        />
      )}
    </div>
  )
}
