import { pgTable, text, jsonb, integer } from 'drizzle-orm/pg-core'

// Timestamps are ISO-8601 strings — lexicographic order equals chronological
// order, which keeps last-write-wins comparisons trivial on both ends.

export const songs = pgTable('songs', {
  id: text('id').primaryKey(),
  folderId: text('folder_id'),
  title: text('title').notNull(),
  /** Full Song JSON as the client defines it — schema evolves without migrations. */
  data: jsonb('data').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
})

export const folders = pgTable('folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
})
