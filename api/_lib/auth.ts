import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { VercelRequest } from '@vercel/node'

/** Constant-time string comparison (hashes first to equalize lengths). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/** The bearer token handed out after login — deterministic, derived from the password. */
export function deriveToken(): string {
  const pw = process.env.APP_PASSWORD
  if (!pw) throw new Error('APP_PASSWORD is not set')
  return createHmac('sha256', pw).update('guitar-tabs-token-v1').digest('hex')
}

export function isAuthorized(req: VercelRequest): boolean {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return false
  return safeEqual(header.slice(7), deriveToken())
}
