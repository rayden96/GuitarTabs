import { create } from 'zustand'
import { db } from './db'
import { getToken, clearToken } from './auth'
import { shouldApplyRemote, shouldClearDirty } from './syncMerge'
import type { Folder, Song } from '../types'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'loggedOut'

interface SyncState {
  status: SyncStatus
  lastSyncAt: string | null
  error: string | null
}

export const useSyncStore = create<SyncState>(() => ({
  status: getToken() ? 'idle' : 'loggedOut',
  lastSyncAt: null,
  error: null,
}))

const LAST_SYNC_KEY = 'lastSyncAt'
let timer: ReturnType<typeof setTimeout> | null = null
let inFlight = false
let queued = false

/** Debounced sync — called after every local write. */
export function scheduleSync(delayMs = 2500): void {
  if (!getToken()) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), delayMs)
}

export async function syncNow(): Promise<void> {
  if (!getToken()) {
    useSyncStore.setState({ status: 'loggedOut' })
    return
  }
  if (inFlight) {
    queued = true
    return
  }
  inFlight = true
  useSyncStore.setState({ status: 'syncing', error: null })
  try {
    const since = (await db.meta.get(LAST_SYNC_KEY))?.value ?? null
    const dirtySongs = await db.songs.where('dirty').equals(1).toArray()
    const dirtyFolders = await db.folders.where('dirty').equals(1).toArray()

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        since,
        songs: dirtySongs.map(({ dirty: _d, ...song }) => song),
        folders: dirtyFolders.map(({ dirty: _d, ...folder }) => folder),
      }),
    })

    if (res.status === 401) {
      clearToken()
      useSyncStore.setState({ status: 'loggedOut' })
      return
    }
    if (!res.ok) throw new Error(`Sync failed (${res.status})`)

    const data = (await res.json()) as { songs: Song[]; folders: Folder[]; serverTime: string }

    await db.transaction('rw', db.songs, db.folders, db.meta, async () => {
      // Clear dirty flags for what we pushed, unless edited again mid-flight.
      for (const pushed of dirtySongs) {
        const cur = await db.songs.get(pushed.id)
        if (cur && shouldClearDirty(pushed.updatedAt, cur.updatedAt)) {
          await db.songs.put({ ...cur, dirty: 0 })
        }
      }
      for (const pushed of dirtyFolders) {
        const cur = await db.folders.get(pushed.id)
        if (cur && shouldClearDirty(pushed.updatedAt, cur.updatedAt)) {
          await db.folders.put({ ...cur, dirty: 0 })
        }
      }
      // Apply what the server sent back (its state already reflects our push).
      for (const remote of data.songs) {
        const local = await db.songs.get(remote.id)
        if (shouldApplyRemote(local, remote)) await db.songs.put({ ...remote, dirty: 0 })
      }
      for (const remote of data.folders) {
        const local = await db.folders.get(remote.id)
        if (shouldApplyRemote(local, remote)) await db.folders.put({ ...remote, dirty: 0 })
      }
      await db.meta.put({ key: LAST_SYNC_KEY, value: data.serverTime })
    })

    useSyncStore.setState({ status: 'synced', lastSyncAt: new Date().toISOString() })
  } catch (err) {
    if (!navigator.onLine) {
      useSyncStore.setState({ status: 'offline' })
    } else {
      useSyncStore.setState({ status: 'error', error: err instanceof Error ? err.message : 'Sync failed' })
    }
  } finally {
    inFlight = false
    if (queued) {
      queued = false
      scheduleSync(500)
    }
  }
}

export function initSync(): void {
  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => {
    if (getToken()) useSyncStore.setState({ status: 'offline' })
  })
  if (getToken()) void syncNow()
}
