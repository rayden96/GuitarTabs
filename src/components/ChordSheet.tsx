import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ChordContent, FretShape } from '../types'
import { CHORD_LIBRARY } from '../lib/chords'
import { db } from '../lib/db'
import { saveUserChord, deleteUserChord } from '../lib/repo'
import ChordDiagram from './ChordDiagram'
import Fretboard from './Fretboard'
import { Sheet, btnOutline, btnSolid, inputCls } from './ui'
import { CloseIcon } from './icons'

const emptyShape = (): FretShape => ({
  frets: [null, null, null, null, null, null],
  fingers: [null, null, null, null, null, null],
  baseFret: 1,
})

export default function ChordSheet({
  initial,
  onApply,
  onClose,
}: {
  initial: ChordContent | null
  onApply: (content: ChordContent) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'library' | 'custom'>(initial ? 'custom' : 'library')
  const [query, setQuery] = useState('')
  const [name, setName] = useState(initial?.name ?? '')
  const [shape, setShape] = useState<FretShape>(initial ? structuredClone(initial.shape) : emptyShape())
  const [saved, setSaved] = useState(false)
  const userChords = useLiveQuery(() => db.userChords.toArray(), [], [])

  const q = query.trim().toLowerCase()
  const filteredLibrary = CHORD_LIBRARY.filter((c) => c.name.toLowerCase().includes(q))
  const filteredUser = userChords.filter((c) => c.name.toLowerCase().includes(q))

  const apply = (chordName: string, chordShape: FretShape) =>
    onApply({ kind: 'chord', name: chordName, shape: structuredClone(chordShape) })

  const hasNotes = shape.frets.some((f) => f !== null)

  return (
    <Sheet title={initial ? 'Edit chord' : 'Add chord'} onClose={onClose} wide>
      <div className="mb-4 flex gap-1 rounded-lg bg-cream p-1">
        {(['library', 'custom'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-surface text-ink shadow-xs' : 'text-soft hover:text-ink'
            }`}
          >
            {t === 'library' ? 'Chord library' : 'Custom / edit'}
          </button>
        ))}
      </div>

      {tab === 'library' ? (
        <div>
          <input
            className={`${inputCls} mb-3 w-full`}
            placeholder="Search chords…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filteredUser.length > 0 && (
            <>
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-soft uppercase">My chords</h3>
              <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {filteredUser.map((c) => (
                  <div key={c.id} className="relative">
                    <button
                      onClick={() => apply(c.name, c.shape)}
                      className="flex w-full flex-col items-center rounded-xl border border-line bg-surface py-2 shadow-xs hover:border-wood/60 hover:bg-cream/50"
                    >
                      <ChordDiagram shape={c.shape} size={52} />
                      <span className="font-display mt-1 text-sm font-bold">{c.name}</span>
                    </button>
                    <button
                      onClick={() => void deleteUserChord(c.id)}
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-line text-soft hover:bg-rose-600 hover:text-white"
                      aria-label={`Delete saved chord ${c.name}`}
                    >
                      <CloseIcon width={10} height={10} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {filteredLibrary.map((c) => (
              <button
                key={c.name}
                onClick={() => apply(c.name, c.shape)}
                className="flex flex-col items-center rounded-xl border border-line bg-surface py-2 shadow-xs hover:border-wood/60 hover:bg-cream/50"
              >
                <ChordDiagram shape={c.shape} size={52} />
                <span className="font-display mt-1 text-sm font-bold">{c.name}</span>
              </button>
            ))}
          </div>
          {filteredLibrary.length === 0 && filteredUser.length === 0 && (
            <p className="py-6 text-center text-sm text-soft">No chords match "{query}"</p>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <input
              className={`${inputCls} w-32`}
              placeholder="Name (Am7…)"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved(false)
              }}
            />
            {hasNotes && <ChordDiagram shape={shape} size={44} />}
          </div>
          <Fretboard shape={shape} onChange={setShape} />
          <div className="mt-4 flex gap-2">
            <button
              className={`${btnOutline} flex-1 px-3 py-2 text-sm`}
              disabled={!name.trim() || !hasNotes || saved}
              onClick={() => {
                void saveUserChord(name.trim(), shape)
                setSaved(true)
              }}
            >
              {saved ? 'Saved ✓' : 'Save to my chords'}
            </button>
            <button
              className={`${btnSolid} flex-1 px-3 py-2 text-sm`}
              disabled={!hasNotes}
              onClick={() => apply(name.trim() || '(chord)', shape)}
            >
              {initial ? 'Update chord' : 'Add chord'}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
