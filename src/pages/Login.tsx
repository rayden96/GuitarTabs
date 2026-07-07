import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { syncNow, useSyncStore } from '../lib/sync'
import { btnSolid, inputCls } from '../components/ui'
import { KeyIcon } from '../components/icons'

export default function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await login(password)
    setBusy(false)
    if (result.ok) {
      useSyncStore.setState({ status: 'idle' })
      void syncNow()
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <KeyIcon />
          </span>
          <div>
            <h1 className="font-semibold">Enable sync</h1>
            <p className="text-xs text-zinc-500">Enter your app password to sync songs between devices.</p>
          </div>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <input
            type="password"
            autoFocus
            className={`${inputCls} w-full`}
            placeholder="App password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
          <button type="submit" className={`${btnSolid} mt-4 w-full py-2.5`} disabled={!password || busy}>
            {busy ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
      <Link to="/" className="mt-4 text-sm text-zinc-500 hover:text-zinc-300">
        Skip — keep working offline
      </Link>
    </div>
  )
}
