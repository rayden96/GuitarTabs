const TOKEN_KEY = 'gt.token'

// Guarded so pure-logic modules can be imported in Node (unit tests).
const storage = typeof localStorage === 'undefined' ? null : localStorage

export function getToken(): string | null {
  return storage?.getItem(TOKEN_KEY) ?? null
}

export function setToken(token: string): void {
  storage?.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  storage?.removeItem(TOKEN_KEY)
}

export async function login(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.status === 401) return { ok: false, error: 'Wrong password' }
    if (!res.ok) {
      // surface the server's own message (e.g. "APP_PASSWORD is not configured")
      let message = `Login failed (${res.status})`
      try {
        const data = (await res.json()) as { error?: string }
        if (data.error) message = `${data.error} (${res.status})`
      } catch {
        // non-JSON body (e.g. a crashed function) — keep the generic message
      }
      return { ok: false, error: message }
    }
    const data = (await res.json()) as { token: string }
    setToken(data.token)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Network error — are you online?' }
  }
}
