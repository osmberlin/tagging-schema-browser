import { create } from "zustand";

/**
 * Small global UI store (zustand). Holds view preferences that should persist
 * across components and across re-opening different presets — e.g. whether the
 * "Raw JSON" panel in the preset detail modal is expanded.
 */
type UiStore = {
  /** Whether the preset detail modal's Raw JSON panel is open. Sticky across presets. */
  presetJsonOpen: boolean;
  setPresetJsonOpen: (open: boolean) => void;
  togglePresetJson: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  presetJsonOpen: false,
  setPresetJsonOpen: (open) => set({ presetJsonOpen: open }),
  togglePresetJson: () => set((s) => ({ presetJsonOpen: !s.presetJsonOpen })),
}));
