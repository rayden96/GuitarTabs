import { db } from './db'
import { newId, nowIso } from './id'
import type { Folder, FolderRecord, Section, Song, SongRecord, UserChord, FretShape } from '../types'
import { scheduleSync } from './sync'

export function newSection(name: string): Section {
  return { id: newId(), name, strummingPattern: null, steps: [] }
}

export function newSong(partial?: Partial<Song>): Song {
  const now = nowIso()
  return {
    id: newId(),
    title: 'Untitled song',
    artist: '',
    folderId: null,
    tempo: 100,
    timeSignature: { beats: 4, unit: 4 },
    capo: 0,
    sections: [newSection('Verse')],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...partial,
  }
}

// --- Songs ---

export async function saveSong(song: Song): Promise<void> {
  const record: SongRecord = { ...song, updatedAt: nowIso(), dirty: 1 }
  await db.songs.put(record)
  scheduleSync()
}

export async function createSong(partial?: Partial<Song>): Promise<Song> {
  const song = newSong(partial)
  await saveSong(song)
  return song
}

export async function getSong(id: string): Promise<SongRecord | undefined> {
  const s = await db.songs.get(id)
  return s && !s.deletedAt ? s : undefined
}

export async function deleteSong(id: string): Promise<void> {
  const s = await db.songs.get(id)
  if (!s) return
  await db.songs.put({ ...s, deletedAt: nowIso(), updatedAt: nowIso(), dirty: 1 })
  scheduleSync()
}

export async function duplicateSong(id: string): Promise<Song | undefined> {
  const s = await getSong(id)
  if (!s) return
  const { dirty: _dirty, ...song } = s
  const copy: Song = {
    ...structuredClone(song),
    id: newId(),
    title: `${song.title} (copy)`,
    createdAt: nowIso(),
    sections: song.sections.map((sec) => ({
      ...sec,
      id: newId(),
      steps: sec.steps.map((st) => ({ ...st, id: newId() })),
    })),
  }
  await saveSong(copy)
  return copy
}

export async function moveSongToFolder(id: string, folderId: string | null): Promise<void> {
  const s = await db.songs.get(id)
  if (!s) return
  await db.songs.put({ ...s, folderId, updatedAt: nowIso(), dirty: 1 })
  scheduleSync()
}

// --- Folders ---

export async function createFolder(name: string): Promise<Folder> {
  const count = await db.folders.count()
  const folder: Folder = {
    id: newId(),
    name,
    sortOrder: count,
    updatedAt: nowIso(),
    deletedAt: null,
  }
  await db.folders.put({ ...folder, dirty: 1 })
  scheduleSync()
  return folder
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const f = await db.folders.get(id)
  if (!f) return
  await db.folders.put({ ...f, name, updatedAt: nowIso(), dirty: 1 })
  scheduleSync()
}

export async function deleteFolder(id: string): Promise<void> {
  const f = await db.folders.get(id)
  if (!f) return
  // Move the folder's songs to the root rather than deleting them.
  const songs = await db.songs.where('folderId').equals(id).toArray()
  const now = nowIso()
  await db.transaction('rw', db.songs, db.folders, async () => {
    for (const s of songs) {
      await db.songs.put({ ...s, folderId: null, updatedAt: now, dirty: 1 })
    }
    await db.folders.put({ ...f, deletedAt: now, updatedAt: now, dirty: 1 })
  })
  scheduleSync()
}

// --- User chords ---

export async function saveUserChord(name: string, shape: FretShape): Promise<UserChord> {
  const chord: UserChord = { id: newId(), name, shape: structuredClone(shape) }
  await db.userChords.put(chord)
  return chord
}

export async function deleteUserChord(id: string): Promise<void> {
  await db.userChords.delete(id)
}

// --- Live query helpers (used with useLiveQuery) ---

export async function listSongs(): Promise<SongRecord[]> {
  const all = await db.songs.toArray()
  return all
    .filter((s) => !s.deletedAt)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
}

export async function listFolders(): Promise<FolderRecord[]> {
  const all = await db.folders.toArray()
  return all.filter((f) => !f.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}
