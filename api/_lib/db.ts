import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql } from 'drizzle-orm'
import * as schema from './schema.js'

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return drizzle(neon(url), { schema })
}

let ensured = false

/** Create the two tables on first use so no manual migration step is needed. */
export async function ensureSchema(db: ReturnType<typeof getDb>): Promise<void> {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS songs (
      id text PRIMARY KEY,
      folder_id text,
      title text NOT NULL,
      data jsonb NOT NULL,
      updated_at text NOT NULL,
      deleted_at text
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS folders (
      id text PRIMARY KEY,
      name text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      updated_at text NOT NULL,
      deleted_at text
    )`)
  ensured = true
}
