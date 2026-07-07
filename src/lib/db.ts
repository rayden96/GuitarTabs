import Dexie, { type Table } from 'dexie'
import type { SongRecord, FolderRecord, UserChord } from '../types'

export interface MetaEntry {
  key: string
  value: string
}

class TabsDB extends Dexie {
  songs!: Table<SongRecord, string>
  folders!: Table<FolderRecord, string>
  userChords!: Table<UserChord, string>
  meta!: Table<MetaEntry, string>

  constructor() {
    super('guitar-tabs')
    this.version(1).stores({
      songs: 'id, folderId, updatedAt, dirty',
      folders: 'id, updatedAt, dirty',
      userChords: 'id, name',
      meta: 'key',
    })
  }
}

export const db = new TabsDB()
