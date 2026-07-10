import { create } from 'zustand'
import type { PresetIssueFilterKey } from '@/utils/presetIssueFilters'

interface SchemaIssueDisclosureStore {
  openById: Record<string, boolean>
  /** Set when user activates an issue filter on an overview page. */
  activeIssueFocus: PresetIssueFilterKey | null
  actions: {
    setOpen: (id: string, open: boolean) => void
    setActiveIssueFocus: (focus: PresetIssueFilterKey | null) => void
  }
}

const useSchemaIssueDisclosureStore = create<SchemaIssueDisclosureStore>()((set) => ({
  openById: {},
  activeIssueFocus: null,
  actions: {
    setOpen: (id, open) =>
      set((state) => ({
        openById: state.openById[id] === open ? state.openById : { ...state.openById, [id]: open },
      })),
    setActiveIssueFocus: (activeIssueFocus) => set({ activeIssueFocus }),
  },
}))

export const useSchemaIssueDisclosureActions = () =>
  useSchemaIssueDisclosureStore((state) => state.actions)

export const useActiveIssueFocus = () =>
  useSchemaIssueDisclosureStore((state) => state.activeIssueFocus)

export function useSchemaIssueDisclosureOpen(
  disclosureId: string,
): [boolean, (open: boolean) => void] {
  const stored = useSchemaIssueDisclosureStore((state) => state.openById[disclosureId])
  const setOpen = useSchemaIssueDisclosureStore((state) => state.actions.setOpen)
  const isOpen = stored ?? false
  return [isOpen, (open) => setOpen(disclosureId, open)]
}

// For use inside effects / event handlers only.
export function getSchemaIssueDisclosureStore() {
  return useSchemaIssueDisclosureStore.getState()
}
