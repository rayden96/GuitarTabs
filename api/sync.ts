import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq, gt } from 'drizzle-orm'
import { getDb, ensureSchema } from './_lib/db.js'
import { isAuthorized } from './_lib/auth.js'
import { songs, folders } from './_lib/schema.js'

interface PushedSong {
  id: string
  title: string
  folderId: string | null
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

interface PushedFolder {
  id: string
  name: string
  sortOrder: number
  updatedAt: string
  deletedAt: string | null
}

const isRecord = (r: unknown): r is { id: string; updatedAt: string } =>
  typeof r === 'object' && r !== null && typeof (r as PushedSong).id === 'string' && typeof (r as PushedSong).updatedAt === 'string'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' })

    const db = getDb()
    await ensureSchema(db)
    const body = (req.body ?? {}) as { since?: string | null; songs?: unknown[]; folders?: unknown[] }
    const since = typeof body.since === 'string' ? body.since : null

    // Apply pushed records with last-write-wins on updatedAt.
    for (const raw of body.songs ?? []) {
      if (!isRecord(raw)) continue
      const song = raw as PushedSong
      const existing = await db.select({ updatedAt: songs.updatedAt }).from(songs).where(eq(songs.id, song.id))
      if (existing.length > 0 && existing[0].updatedAt >= song.updatedAt) continue
      const row = {
        folderId: song.folderId ?? null,
        title: song.title ?? '',
        data: song,
        updatedAt: song.updatedAt,
        deletedAt: song.deletedAt ?? null,
      }
      if (existing.length > 0) await db.update(songs).set(row).where(eq(songs.id, song.id))
      else await db.insert(songs).values({ id: song.id, ...row })
    }

    for (const raw of body.folders ?? []) {
      if (!isRecord(raw)) continue
      const folder = raw as PushedFolder
      const existing = await db.select({ updatedAt: folders.updatedAt }).from(folders).where(eq(folders.id, folder.id))
      if (existing.length > 0 && existing[0].updatedAt >= folder.updatedAt) continue
      const row = {
        name: folder.name ?? '',
        sortOrder: typeof folder.sortOrder === 'number' ? folder.sortOrder : 0,
        updatedAt: folder.updatedAt,
        deletedAt: folder.deletedAt ?? null,
      }
      if (existing.length > 0) await db.update(folders).set(row).where(eq(folders.id, folder.id))
      else await db.insert(folders).values({ id: folder.id, ...row })
    }

    // Return everything that changed since the client's last sync (including tombstones).
    const changedSongs = since
      ? await db.select().from(songs).where(gt(songs.updatedAt, since))
      : await db.select().from(songs)
    const changedFolders = since
      ? await db.select().from(folders).where(gt(folders.updatedAt, since))
      : await db.select().from(folders)

    return res.status(200).json({
      songs: changedSongs.map((r) => ({
        ...(r.data as Record<string, unknown>),
        id: r.id,
        folderId: r.folderId,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      })),
      folders: changedFolders.map((r) => ({
        id: r.id,
        name: r.name,
        sortOrder: r.sortOrder,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      })),
      serverTime: new Date().toISOString(),
    })
  } catch (err) {
    console.error('sync failed:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
}
