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
  currentPrNumber: number | null
  previousPrNumber: number | null
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

function pointerStillInHistory(
  prNumber: number | null,
  entries: PrPreviewHistoryEntry[],
): number | null {
  if (prNumber === null) return null
  return entries.some((entry) => entry.prNumber === prNumber) ? prNumber : null
}

const usePrPreviewHistoryStore = create<PrPreviewHistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      currentPrNumber: null,
      previousPrNumber: null,
      actions: {
        recordOpen: (prNumber) => {
          const now = Date.now()
          const pruned = pruneEntries(get().entries, now)
          const without = pruned.filter((entry) => entry.prNumber !== prNumber)
          const current = get().currentPrNumber
          const previousPrNumber =
            current !== null && current !== prNumber ? current : get().previousPrNumber

          set({
            entries: capByRecency([...without, { prNumber, openedAt: now }]),
            currentPrNumber: prNumber,
            previousPrNumber,
          })
        },
        pruneExpired: () => {
          const currentEntries = get().entries
          const pruned = pruneEntries(currentEntries)
          const nextCurrent = pointerStillInHistory(get().currentPrNumber, pruned)
          const nextPrevious = pointerStillInHistory(get().previousPrNumber, pruned)
          if (
            entriesEqual(currentEntries, pruned) &&
            nextCurrent === get().currentPrNumber &&
            nextPrevious === get().previousPrNumber
          ) {
            return
          }
          set({
            entries: pruned,
            currentPrNumber: nextCurrent,
            previousPrNumber: nextPrevious,
          })
        },
      },
    }),
    {
      name: 'tagging-schema-browser-pr-preview-history',
      partialize: (state) => ({
        entries: state.entries,
        currentPrNumber: state.currentPrNumber,
        previousPrNumber: state.previousPrNumber,
      }),
      version: 2,
      migrate: (persisted) => {
        const state = persisted as {
          entries?: PrPreviewHistoryEntry[]
          lastUsedPrNumber?: number | null
          currentPrNumber?: number | null
          previousPrNumber?: number | null
        }
        return {
          entries: state.entries ?? [],
          currentPrNumber: state.currentPrNumber ?? state.lastUsedPrNumber ?? null,
          previousPrNumber: state.previousPrNumber ?? null,
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.actions.pruneExpired()
      },
    },
  ),
)

export const usePrPreviewHistory = () =>
  usePrPreviewHistoryStore(useShallow((state) => sortPrPreviewHistory(state.entries)))

export const usePreviousPrNumber = () => usePrPreviewHistoryStore((state) => state.previousPrNumber)

export const useCurrentPrNumber = () => usePrPreviewHistoryStore((state) => state.currentPrNumber)

export const usePrPreviewHistoryActions = () => usePrPreviewHistoryStore((state) => state.actions)

/** @internal test hook */
export const prPreviewHistoryStore = usePrPreviewHistoryStore
