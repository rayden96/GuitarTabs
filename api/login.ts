import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deriveToken, safeEqual } from './_lib/auth'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const password = (req.body as { password?: unknown } | undefined)?.password
  const expected = process.env.APP_PASSWORD
  if (!expected) return res.status(500).json({ error: 'APP_PASSWORD is not configured' })
  if (typeof password !== 'string' || !safeEqual(password, expected)) {
    return res.status(401).json({ error: 'Wrong password' })
  }
  return res.status(200).json({ token: deriveToken() })
}
