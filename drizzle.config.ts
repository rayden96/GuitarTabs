import { existsSync, readFileSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit doesn't load .env on its own — pick up DATABASE_URL from it.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

export default defineConfig({
  schema: './api/_lib/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
