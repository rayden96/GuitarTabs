let sentinel: WakeLockSentinel | null = null
let wanted = false

async function acquire(): Promise<void> {
  if (!('wakeLock' in navigator)) return
  try {
    sentinel = await navigator.wakeLock.request('screen')
    sentinel.addEventListener('release', () => {
      sentinel = null
    })
  } catch {
    // Denied (e.g. low battery) — practice continues without it.
  }
}

document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible' && !sentinel) void acquire()
})

export function keepAwake(on: boolean): void {
  wanted = on
  if (on && !sentinel) void acquire()
  if (!on && sentinel) {
    void sentinel.release()
    sentinel = null
  }
}
