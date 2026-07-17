import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const HISTORY_TTL_MS = 60 * 24 * 60 * 60 * 1000

export type PrPreviewHistoryEntry = {
  prNumber: number
  openedAt: number
}

interface PrPreviewHistoryStore {
  entries: PrPreviewHistoryEntry[]
  lastUsedPrNumber: number | null
  actions: {
    recordOpen: (prNumber: number) => void
    pruneExpired: () => void
  }
}

function pruneEntries(entries: PrPreviewHistoryEntry[], now = Date.now()): PrPreviewHistoryEntry[] {
  const cutoff = now - HISTORY_TTL_MS
  return entries.filter((entry) => entry.openedAt >= cutoff)
}

const usePrPreviewHistoryStore = create<PrPreviewHistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      lastUsedPrNumber: null,
      actions: {
        recordOpen: (prNumber) => {
          const now = Date.now()
          const without = pruneEntries(get().entries, now).filter(
            (entry) => entry.prNumber !== prNumber,
          )
          set({
            entries: [{ prNumber, openedAt: now }, ...without],
            lastUsedPrNumber: prNumber,
          })
        },
        pruneExpired: () => {
          const pruned = pruneEntries(get().entries)
          const lastUsed = get().lastUsedPrNumber
          const lastStillPresent =
            lastUsed !== null && pruned.some((entry) => entry.prNumber === lastUsed)
          set({
            entries: pruned,
            lastUsedPrNumber: lastStillPresent ? lastUsed : null,
          })
        },
      },
    }),
    {
      name: 'tagging-schema-browser-pr-preview-history',
      partialize: (state) => ({
        entries: state.entries,
        lastUsedPrNumber: state.lastUsedPrNumber,
      }),
      version: 1,
    },
  ),
)

export const usePrPreviewHistory = () => usePrPreviewHistoryStore((state) => state.entries)

export const useLastUsedPrNumber = () => usePrPreviewHistoryStore((state) => state.lastUsedPrNumber)

export const usePrPreviewHistoryActions = () => usePrPreviewHistoryStore((state) => state.actions)

/** @internal test hook */
export const prPreviewHistoryStore = usePrPreviewHistoryStore
