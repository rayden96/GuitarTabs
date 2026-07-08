import { useNavigate } from 'react-router-dom'
import { useSyncStore, syncNow } from '../lib/sync'
import { CloudCheckIcon, CloudIcon, CloudOffIcon, KeyIcon, SpinnerIcon } from './icons'

export default function SyncIndicator() {
  const { status, error } = useSyncStore()
  const navigate = useNavigate()

  const onClick = () => {
    if (status === 'loggedOut') return navigate('/login')
    // tooltips don't exist on touch screens — show the failure reason on tap
    if (status === 'error') alert(`Sync error: ${error ?? 'unknown'}\n\nRetrying now…`)
    void syncNow()
  }

  const view = {
    loggedOut: { icon: <KeyIcon width={18} height={18} />, cls: 'text-faint', title: 'Not logged in — tap to enable sync' },
    offline: { icon: <CloudOffIcon width={18} height={18} />, cls: 'text-faint', title: 'Offline — changes saved locally' },
    syncing: { icon: <SpinnerIcon width={18} height={18} />, cls: 'text-wood', title: 'Syncing…' },
    synced: { icon: <CloudCheckIcon width={18} height={18} />, cls: 'text-emerald-700', title: 'Synced' },
    error: { icon: <CloudIcon width={18} height={18} />, cls: 'text-rose-600', title: error ?? 'Sync error — tap to retry' },
    idle: { icon: <CloudIcon width={18} height={18} />, cls: 'text-soft', title: 'Tap to sync' },
  }[status]

  return (
    <button
      onClick={onClick}
      title={view.title}
      aria-label={view.title}
      className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-cream ${view.cls}`}
    >
      {view.icon}
    </button>
  )
}
