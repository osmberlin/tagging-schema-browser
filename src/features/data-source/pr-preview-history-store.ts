import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/shallow'

const HISTORY_TTL_MS = 60 * 24 * 60 * 60 * 1000
const HISTORY_MAX_ENTRIES = 20

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

/** Stable menu order: higher PR numbers first (typically newer on the same repo). */
export function sortPrPreviewHistory(entries: PrPreviewHistoryEntry[]): PrPreviewHistoryEntry[] {
  return [...entries].sort((a, b) => b.prNumber - a.prNumber)
}

function capByRecency(entries: PrPreviewHistoryEntry[]): PrPreviewHistoryEntry[] {
  return [...entries]
    .sort((a, b) => b.openedAt - a.openedAt || b.prNumber - a.prNumber)
    .slice(0, HISTORY_MAX_ENTRIES)
}

function entriesEqual(a: PrPreviewHistoryEntry[], b: PrPreviewHistoryEntry[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].prNumber !== b[i].prNumber || a[i].openedAt !== b[i].openedAt) return false
  }
  return true
}

const usePrPreviewHistoryStore = create<PrPreviewHistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      lastUsedPrNumber: null,
      actions: {
        recordOpen: (prNumber) => {
          const now = Date.now()
          const pruned = pruneEntries(get().entries, now)
          const without = pruned.filter((entry) => entry.prNumber !== prNumber)
          set({
            entries: capByRecency([...without, { prNumber, openedAt: now }]),
            lastUsedPrNumber: prNumber,
          })
        },
        pruneExpired: () => {
          const current = get().entries
          const pruned = pruneEntries(current)
          const lastUsed = get().lastUsedPrNumber
          const lastStillPresent =
            lastUsed !== null && pruned.some((entry) => entry.prNumber === lastUsed)
          const nextLastUsed = lastStillPresent ? lastUsed : null
          if (entriesEqual(current, pruned) && nextLastUsed === lastUsed) return
          set({
            entries: pruned,
            lastUsedPrNumber: nextLastUsed,
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
      onRehydrateStorage: () => (state) => {
        state?.actions.pruneExpired()
      },
    },
  ),
)

export const usePrPreviewHistory = () =>
  usePrPreviewHistoryStore(useShallow((state) => sortPrPreviewHistory(state.entries)))

export const useLastUsedPrNumber = () => usePrPreviewHistoryStore((state) => state.lastUsedPrNumber)

export const usePrPreviewHistoryActions = () => usePrPreviewHistoryStore((state) => state.actions)

/** @internal test hook */
export const prPreviewHistoryStore = usePrPreviewHistoryStore
