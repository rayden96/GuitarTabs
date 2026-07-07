import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { FolderRecord, SongRecord } from '../types'
import { createFolder, createSong, deleteFolder, deleteSong, duplicateSong, listFolders, listSongs, moveSongToFolder, renameFolder } from '../lib/repo'
import SyncIndicator from '../components/SyncIndicator'
import { Sheet, btnGhost, btnSolid, inputCls, EmptyHint } from '../components/ui'
import { ChevronIcon, CopyIcon, DotsIcon, FolderIcon, MusicIcon, PencilIcon, PlayIcon, PlusIcon, SearchIcon, TrashIcon } from '../components/icons'

function SongRow({ song, onMenu }: { song: SongRecord; onMenu: () => void }) {
  const navigate = useNavigate()
  return (
    <div
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-900"
      onClick={() => navigate(`/song/${song.id}/play`)}
    >
      <MusicIcon className="shrink-0 text-zinc-600" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{song.title}</div>
        <div className="truncate text-xs text-zinc-500">
          {song.artist && <span>{song.artist} · </span>}♩ {song.tempo} · {song.timeSignature.beats}/{song.timeSignature.unit}
        </div>
      </div>
      <button
        className={`${btnGhost} h-9 w-9 shrink-0`}
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/song/${song.id}/edit`)
        }}
        aria-label={`Edit ${song.title}`}
      >
        <PencilIcon width={16} height={16} />
      </button>
      <button
        className={`${btnGhost} h-9 w-9 shrink-0`}
        onClick={(e) => {
          e.stopPropagation()
          onMenu()
        }}
        aria-label={`Actions for ${song.title}`}
      >
        <DotsIcon width={16} height={16} />
      </button>
    </div>
  )
}

export default function Library() {
  const navigate = useNavigate()
  const songs = useLiveQuery(listSongs, [], [] as SongRecord[])
  const folders = useLiveQuery(listFolders, [], [] as FolderRecord[])
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [menuSong, setMenuSong] = useState<SongRecord | null>(null)
  const [moveSong, setMoveSong] = useState<SongRecord | null>(null)
  const [folderDialog, setFolderDialog] = useState<{ id: string | null; name: string } | null>(null)
  const [menuFolder, setMenuFolder] = useState<FolderRecord | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => songs.filter((s) => !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)),
    [songs, q],
  )
  const rootSongs = filtered.filter((s) => !s.folderId || !folders.some((f) => f.id === s.folderId))
  const searching = q.length > 0

  const addSong = async () => {
    const song = await createSong()
    navigate(`/song/${song.id}/edit`)
  }

  return (
    <div className="px-4 pb-24 pt-safe">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-bold tracking-tight">Guitar Tabs</h1>
        <SyncIndicator />
      </header>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" width={16} height={16} />
          <input className={`${inputCls} w-full pl-9`} placeholder="Search songs…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className={`${btnGhost} h-10 w-10`} onClick={() => setFolderDialog({ id: null, name: '' })} aria-label="New folder">
          <FolderIcon />
        </button>
        <button className={`${btnSolid} h-10 gap-1 px-3 text-sm`} onClick={() => void addSong()}>
          <PlusIcon width={16} height={16} /> Song
        </button>
      </div>

      {songs.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <MusicIcon width={48} height={48} className="text-zinc-700" />
          <p className="mt-4 mb-6 text-zinc-400">No songs yet. Add the first song you're learning.</p>
          <button className={`${btnSolid} px-4 py-2`} onClick={() => void addSong()}>
            <PlusIcon width={18} height={18} /> Add a song
          </button>
        </div>
      )}

      {/* folders */}
      {!searching &&
        folders.map((folder) => {
          const inFolder = filtered.filter((s) => s.folderId === folder.id)
          const isCollapsed = collapsed[folder.id]
          return (
            <section key={folder.id} className="mb-2">
              <div className="flex items-center gap-1 rounded-xl px-2 py-1.5">
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setCollapsed((c) => ({ ...c, [folder.id]: !c[folder.id] }))}
                >
                  <ChevronIcon width={16} height={16} className={`shrink-0 text-zinc-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                  <FolderIcon width={16} height={16} className="shrink-0 text-amber-400/80" />
                  <span className="truncate text-sm font-semibold">{folder.name}</span>
                  <span className="text-xs text-zinc-600">{inFolder.length}</span>
                </button>
                <button className={`${btnGhost} h-8 w-8`} onClick={() => setMenuFolder(folder)} aria-label={`Actions for folder ${folder.name}`}>
                  <DotsIcon width={15} height={15} />
                </button>
              </div>
              {!isCollapsed && (
                <div className="ml-3 border-l border-zinc-800/70 pl-2">
                  {inFolder.map((s) => (
                    <SongRow key={s.id} song={s} onMenu={() => setMenuSong(s)} />
                  ))}
                  {inFolder.length === 0 && <p className="px-3 py-2 text-xs text-zinc-600">Empty folder</p>}
                </div>
              )}
            </section>
          )
        })}

      {/* root songs (or all matches when searching) */}
      {(searching ? filtered : rootSongs).map((s) => (
        <SongRow key={s.id} song={s} onMenu={() => setMenuSong(s)} />
      ))}
      {searching && filtered.length === 0 && <EmptyHint>No songs match "{query}"</EmptyHint>}

      {/* song actions */}
      {menuSong && (
        <Sheet title={menuSong.title} onClose={() => setMenuSong(null)}>
          <div className="flex flex-col">
            {[
              { label: 'Play', icon: <PlayIcon width={18} height={18} />, fn: () => navigate(`/song/${menuSong.id}/play`) },
              { label: 'Edit', icon: <PencilIcon width={18} height={18} />, fn: () => navigate(`/song/${menuSong.id}/edit`) },
              {
                label: 'Duplicate',
                icon: <CopyIcon width={18} height={18} />,
                fn: () => void duplicateSong(menuSong.id).then(() => setMenuSong(null)),
              },
              {
                label: 'Move to folder…',
                icon: <FolderIcon width={18} height={18} />,
                fn: () => {
                  setMoveSong(menuSong)
                  setMenuSong(null)
                },
              },
            ].map((a) => (
              <button key={a.label} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-zinc-800" onClick={a.fn}>
                <span className="text-zinc-400">{a.icon}</span> {a.label}
              </button>
            ))}
            <button
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-rose-400 hover:bg-zinc-800"
              onClick={() => {
                if (confirm(`Delete "${menuSong.title}"?`)) {
                  void deleteSong(menuSong.id)
                  setMenuSong(null)
                }
              }}
            >
              <TrashIcon width={18} height={18} /> Delete
            </button>
          </div>
        </Sheet>
      )}

      {/* move to folder */}
      {moveSong && (
        <Sheet title={`Move "${moveSong.title}"`} onClose={() => setMoveSong(null)}>
          <div className="flex flex-col">
            {[{ id: null as string | null, name: 'No folder' }, ...folders].map((f) => (
              <button
                key={f.id ?? 'root'}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-zinc-800 ${moveSong.folderId === f.id ? 'text-amber-300' : ''}`}
                onClick={() => {
                  void moveSongToFolder(moveSong.id, f.id)
                  setMoveSong(null)
                }}
              >
                <FolderIcon width={18} height={18} className="text-zinc-400" /> {f.name}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* folder actions */}
      {menuFolder && (
        <Sheet title={menuFolder.name} onClose={() => setMenuFolder(null)}>
          <div className="flex flex-col">
            <button
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-zinc-800"
              onClick={() => {
                setFolderDialog({ id: menuFolder.id, name: menuFolder.name })
                setMenuFolder(null)
              }}
            >
              <PencilIcon width={18} height={18} className="text-zinc-400" /> Rename
            </button>
            <button
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-rose-400 hover:bg-zinc-800"
              onClick={() => {
                if (confirm(`Delete folder "${menuFolder.name}"? Songs inside move to the library root.`)) {
                  void deleteFolder(menuFolder.id)
                  setMenuFolder(null)
                }
              }}
            >
              <TrashIcon width={18} height={18} /> Delete folder
            </button>
          </div>
        </Sheet>
      )}

      {/* create / rename folder */}
      {folderDialog && (
        <Sheet title={folderDialog.id ? 'Rename folder' : 'New folder'} onClose={() => setFolderDialog(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const name = folderDialog.name.trim()
              if (!name) return
              if (folderDialog.id) void renameFolder(folderDialog.id, name)
              else void createFolder(name)
              setFolderDialog(null)
            }}
          >
            <input
              autoFocus
              className={`${inputCls} w-full`}
              placeholder="Folder name"
              value={folderDialog.name}
              onChange={(e) => setFolderDialog({ ...folderDialog, name: e.target.value })}
            />
            <button type="submit" className={`${btnSolid} mt-3 w-full py-2.5`} disabled={!folderDialog.name.trim()}>
              {folderDialog.id ? 'Rename' : 'Create'}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  )
}
