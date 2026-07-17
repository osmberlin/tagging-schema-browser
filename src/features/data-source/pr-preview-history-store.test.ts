import { beforeEach, describe, expect, it } from 'vitest'
import { prPreviewHistoryStore, sortPrPreviewHistory } from './pr-preview-history-store'

describe('sortPrPreviewHistory', () => {
  it('orders by PR number descending', () => {
    expect(
      sortPrPreviewHistory([
        { prNumber: 100, openedAt: 1 },
        { prNumber: 2309, openedAt: 2 },
        { prNumber: 1991, openedAt: 3 },
      ]).map((e) => e.prNumber),
    ).toEqual([2309, 1991, 100])
  })
})

describe('pr-preview-history-store', () => {
  beforeEach(() => {
    prPreviewHistoryStore.setState({
      entries: [],
      currentPrNumber: null,
      previousPrNumber: null,
    })
  })

  it('records PR opens without reordering the list', () => {
    const { recordOpen } = prPreviewHistoryStore.getState().actions
    recordOpen(100)
    recordOpen(200)
    expect(
      prPreviewHistoryStore
        .getState()
        .entries.map((e) => e.prNumber)
        .sort((a, b) => b - a),
    ).toEqual([200, 100])
    expect(prPreviewHistoryStore.getState().currentPrNumber).toBe(200)
    expect(prPreviewHistoryStore.getState().previousPrNumber).toBe(100)
  })

  it('tracks the PR before the current one when switching', () => {
    const { recordOpen } = prPreviewHistoryStore.getState().actions
    recordOpen(1991)
    expect(prPreviewHistoryStore.getState().previousPrNumber).toBeNull()

    recordOpen(2309)
    expect(prPreviewHistoryStore.getState().currentPrNumber).toBe(2309)
    expect(prPreviewHistoryStore.getState().previousPrNumber).toBe(1991)

    recordOpen(1991)
    expect(prPreviewHistoryStore.getState().currentPrNumber).toBe(1991)
    expect(prPreviewHistoryStore.getState().previousPrNumber).toBe(2309)
  })

  it('keeps list position when re-opening a PR', () => {
    const { recordOpen } = prPreviewHistoryStore.getState().actions
    recordOpen(1991)
    recordOpen(2309)
    const orderBefore = sortPrPreviewHistory(prPreviewHistoryStore.getState().entries).map(
      (e) => e.prNumber,
    )
    recordOpen(1991)
    const orderAfter = sortPrPreviewHistory(prPreviewHistoryStore.getState().entries).map(
      (e) => e.prNumber,
    )
    expect(orderAfter).toEqual(orderBefore)
    expect(prPreviewHistoryStore.getState().currentPrNumber).toBe(1991)
    expect(prPreviewHistoryStore.getState().previousPrNumber).toBe(2309)
  })

  it('prunes entries older than 60 days', () => {
    const sixtyOneDaysMs = 61 * 24 * 60 * 60 * 1000
    prPreviewHistoryStore.setState({
      entries: [
        { prNumber: 1, openedAt: Date.now() - sixtyOneDaysMs },
        { prNumber: 2, openedAt: Date.now() },
      ],
      currentPrNumber: 1,
      previousPrNumber: 1,
    })
    prPreviewHistoryStore.getState().actions.pruneExpired()
    expect(prPreviewHistoryStore.getState().entries.map((e) => e.prNumber)).toEqual([2])
    expect(prPreviewHistoryStore.getState().currentPrNumber).toBeNull()
    expect(prPreviewHistoryStore.getState().previousPrNumber).toBeNull()
  })

  it('caps history at 20 entries by least recently opened', () => {
    const { recordOpen } = prPreviewHistoryStore.getState().actions
    for (let i = 1; i <= 25; i++) recordOpen(i)
    const numbers = sortPrPreviewHistory(prPreviewHistoryStore.getState().entries).map(
      (e) => e.prNumber,
    )
    expect(numbers).toHaveLength(20)
    expect(numbers).toEqual([
      25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6,
    ])
  })
})
