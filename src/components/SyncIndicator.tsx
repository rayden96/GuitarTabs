import { useNavigate } from 'react-router-dom'
import { useSyncStore, syncNow } from '../lib/sync'
import { CloudCheckIcon, CloudIcon, CloudOffIcon, KeyIcon, SpinnerIcon } from './icons'

export default function SyncIndicator() {
  const { status, error } = useSyncStore()
  const navigate = useNavigate()

  const onClick = () => {
    if (status === 'loggedOut') navigate('/login')
    else void syncNow()
  }

  const view = {
    loggedOut: { icon: <KeyIcon width={18} height={18} />, cls: 'text-zinc-500', title: 'Not logged in — tap to enable sync' },
    offline: { icon: <CloudOffIcon width={18} height={18} />, cls: 'text-zinc-500', title: 'Offline — changes saved locally' },
    syncing: { icon: <SpinnerIcon width={18} height={18} />, cls: 'text-amber-300', title: 'Syncing…' },
    synced: { icon: <CloudCheckIcon width={18} height={18} />, cls: 'text-emerald-400', title: 'Synced' },
    error: { icon: <CloudIcon width={18} height={18} />, cls: 'text-rose-400', title: error ?? 'Sync error — tap to retry' },
    idle: { icon: <CloudIcon width={18} height={18} />, cls: 'text-zinc-400', title: 'Tap to sync' },
  }[status]

  return (
    <button onClick={onClick} title={view.title} aria-label={view.title} className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-800 ${view.cls}`}>
      {view.icon}
    </button>
  )
}
