// Pure merge decisions for pull results — kept free of Dexie/fetch so it's unit-testable.

interface Versioned {
  updatedAt: string
  dirty?: 0 | 1
}

/**
 * Decide whether an incoming remote record should overwrite the local one.
 * Local wins only when it has unpushed changes (dirty) that are at least as new —
 * those changes will be pushed on the next sync instead.
 */
export function shouldApplyRemote(local: Versioned | undefined, remote: Versioned): boolean {
  if (!local) return true
  if (local.dirty === 1 && local.updatedAt >= remote.updatedAt) return false
  return true
}

/**
 * After a push, only clear the dirty flag if the record wasn't edited again
 * while the request was in flight (updatedAt unchanged).
 */
export function shouldClearDirty(pushedUpdatedAt: string, currentUpdatedAt: string): boolean {
  return pushedUpdatedAt === currentUpdatedAt
}
