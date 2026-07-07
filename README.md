# Guitar Tabs

Personal tab editor + practice tool. Create songs from chords and manual tab, give sections strumming patterns, then practice with a metronome that highlights the tab in time. Works fully offline as a PWA; songs sync across devices through a tiny API when logged in.

## Stack

- **Vite + React + TypeScript** SPA, Tailwind CSS v4, Zustand
- **Dexie (IndexedDB)** — local source of truth, app is fully usable offline
- **vite-plugin-pwa** — installable, precached shell
- **Web Audio API** — lookahead-scheduled metronome (sample-accurate)
- **Vercel Functions** (`api/`) + **Neon Postgres** + Drizzle — sync + single-password auth
- Sync is last-write-wins on `updatedAt` with tombstoned deletes; one `POST /api/sync` does push + pull

## Develop

```sh
npm install
npm run dev        # UI only (sync API not available — app works offline)
npm test           # vitest unit tests
npm run build      # typecheck + production build
vercel dev         # full stack including api/ functions (needs .env)
```

## Deploy (one-time setup)

1. Push this repo to GitHub and import it into Vercel (framework preset: **Vite**).
2. In the Vercel project, add the **Neon** integration (Storage → Neon Postgres, free tier). This sets `DATABASE_URL` automatically.
3. Add an `APP_PASSWORD` environment variable — the single password that protects your data.
4. Locally, copy `.env.example` to `.env`, fill in the same `DATABASE_URL`, and create the tables:
   ```sh
   npm run db:push
   ```
5. Deploy. Open the site, tap the key icon, enter your password — sync is on.
6. On your phone: open the URL, log in, then "Add to Home Screen" to install the PWA.

## Notes

- Songs are stored whole as JSON (`songs.data` JSONB) — the client schema can evolve without server migrations.
- Timestamps are ISO strings everywhere; lexicographic compare = chronological compare.
- Custom chords saved to "My chords" live on the device (they're also embedded in any song that uses them, so songs always sync complete).
