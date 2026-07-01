import type { SchemaReference } from "@/utils/dataUrl";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ReferenceStore = {
  reference: SchemaReference;
  setReference: (reference: SchemaReference) => void;
  /** Optimistic toggle selection while the pill animates and schema preloads. */
  pendingReference: SchemaReference | null;
  setPendingReference: (reference: SchemaReference | null) => void;
  /** True while waiting for the target reference schema to finish preloading. */
  referencePreloading: boolean;
  setReferencePreloading: (preloading: boolean) => void;
};

export const useReferenceStore = create<ReferenceStore>()(
  persist(
    (set) => ({
      reference: "interem",
      setReference: (reference) => set({ reference }),
      pendingReference: null,
      setPendingReference: (pendingReference) => set({ pendingReference }),
      referencePreloading: false,
      setReferencePreloading: (referencePreloading) => set({ referencePreloading }),
    }),
    {
      name: "tagging-schema-browser-reference",
      partialize: (state) => ({ reference: state.reference }),
    },
  ),
);
