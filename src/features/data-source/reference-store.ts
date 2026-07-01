import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SchemaReference } from '@/utils/dataUrl'

interface ReferenceStore {
  reference: SchemaReference
  pendingReference: SchemaReference | null
  referencePreloading: boolean
  actions: {
    setReference: (reference: SchemaReference) => void
    setPendingReference: (reference: SchemaReference | null) => void
    setReferencePreloading: (preloading: boolean) => void
  }
}

const useReferenceStore = create<ReferenceStore>()(
  persist(
    (set) => ({
      reference: 'interem',
      pendingReference: null,
      referencePreloading: false,
      actions: {
        setReference: (reference) => set({ reference }),
        setPendingReference: (pendingReference) => set({ pendingReference }),
        setReferencePreloading: (referencePreloading) => set({ referencePreloading }),
      },
    }),
    {
      name: 'tagging-schema-browser-reference',
      partialize: (state) => ({ reference: state.reference }),
    },
  ),
)

export const useReference = () => useReferenceStore((state) => state.reference)

export const usePendingReference = () => useReferenceStore((state) => state.pendingReference)

export const useReferencePreloading = () => useReferenceStore((state) => state.referencePreloading)

export const useReferenceActions = () => useReferenceStore((state) => state.actions)
