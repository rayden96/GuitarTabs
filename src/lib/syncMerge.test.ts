import { describe, expect, it } from 'vitest'
import { shouldApplyRemote, shouldClearDirty } from './syncMerge'

describe('shouldApplyRemote (last-write-wins)', () => {
  it('applies when there is no local record', () => {
    expect(shouldApplyRemote(undefined, { updatedAt: '2026-01-01T00:00:00Z' })).toBe(true)
  })

  it('applies over a clean local record regardless of timestamps', () => {
    expect(shouldApplyRemote({ updatedAt: '2026-06-01T00:00:00Z', dirty: 0 }, { updatedAt: '2026-01-01T00:00:00Z' })).toBe(true)
  })

  it('keeps a dirty local record that is newer (it will be pushed next)', () => {
    expect(shouldApplyRemote({ updatedAt: '2026-06-02T00:00:00Z', dirty: 1 }, { updatedAt: '2026-06-01T00:00:00Z' })).toBe(false)
  })

  it('applies a newer remote even over a dirty local record', () => {
    expect(shouldApplyRemote({ updatedAt: '2026-06-01T00:00:00Z', dirty: 1 }, { updatedAt: '2026-06-02T00:00:00Z' })).toBe(true)
  })
})

describe('shouldClearDirty', () => {
  it('clears when the record was not edited while the push was in flight', () => {
    expect(shouldClearDirty('2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z')).toBe(true)
  })
  it('keeps dirty when the record changed mid-flight', () => {
    expect(shouldClearDirty('2026-06-01T00:00:00Z', '2026-06-01T00:00:05Z')).toBe(false)
  })
})
