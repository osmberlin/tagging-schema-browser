import { create } from 'zustand'

interface SchemaIssueDisclosureStore {
  openById: Record<string, boolean>
  actions: {
    setOpen: (id: string, open: boolean) => void
    toggle: (id: string) => void
  }
}

const useSchemaIssueDisclosureStore = create<SchemaIssueDisclosureStore>()((set) => ({
  openById: {},
  actions: {
    setOpen: (id, open) =>
      set((state) => ({
        openById: state.openById[id] === open ? state.openById : { ...state.openById, [id]: open },
      })),
    toggle: (id) =>
      set((state) => ({
        openById: { ...state.openById, [id]: !(state.openById[id] ?? false) },
      })),
  },
}))

export const useSchemaIssueDisclosureActions = () =>
  useSchemaIssueDisclosureStore((state) => state.actions)

export function useSchemaIssueDisclosureOpen(
  disclosureId: string,
  defaultOpen = false,
): [boolean, (open: boolean) => void] {
  const stored = useSchemaIssueDisclosureStore((state) => state.openById[disclosureId])
  const setOpen = useSchemaIssueDisclosureStore((state) => state.actions.setOpen)
  const isOpen = stored ?? defaultOpen
  return [isOpen, (open) => setOpen(disclosureId, open)]
}
