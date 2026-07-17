import { beforeEach, describe, expect, it } from 'vitest'
import { prPreviewHistoryStore } from './pr-preview-history-store'

describe('pr-preview-history-store', () => {
  beforeEach(() => {
    prPreviewHistoryStore.setState({ entries: [], lastUsedPrNumber: null })
  })

  it('records PR opens with most recent first', () => {
    const { recordOpen } = prPreviewHistoryStore.getState().actions
    recordOpen(100)
    recordOpen(200)
    expect(prPreviewHistoryStore.getState().entries.map((e) => e.prNumber)).toEqual([200, 100])
    expect(prPreviewHistoryStore.getState().lastUsedPrNumber).toBe(200)
  })

  it('moves an existing PR to the front on re-open', () => {
    const { recordOpen } = prPreviewHistoryStore.getState().actions
    recordOpen(100)
    recordOpen(200)
    recordOpen(100)
    expect(prPreviewHistoryStore.getState().entries.map((e) => e.prNumber)).toEqual([100, 200])
    expect(prPreviewHistoryStore.getState().lastUsedPrNumber).toBe(100)
  })

  it('prunes entries older than 60 days', () => {
    const sixtyOneDaysMs = 61 * 24 * 60 * 60 * 1000
    prPreviewHistoryStore.setState({
      entries: [
        { prNumber: 1, openedAt: Date.now() - sixtyOneDaysMs },
        { prNumber: 2, openedAt: Date.now() },
      ],
      lastUsedPrNumber: 1,
    })
    prPreviewHistoryStore.getState().actions.pruneExpired()
    expect(prPreviewHistoryStore.getState().entries.map((e) => e.prNumber)).toEqual([2])
    expect(prPreviewHistoryStore.getState().lastUsedPrNumber).toBeNull()
  })
})
