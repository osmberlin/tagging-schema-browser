import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import {
  type PresetSwitchSearch,
  presetSwitchSearchSchema,
} from '@/components/PagePresetSwitch/presetSwitchSearch'

/** `[state, setState]` for `/preset-switch` search params (preset1, preset2). */
export function usePresetSwitchSearch() {
  const state = useSearch({ strict: false, select: (raw) => presetSwitchSearchSchema.parse(raw) })
  const navigate = useNavigate()
  const setState = useCallback(
    (patch: Partial<PresetSwitchSearch>) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )
  return [state, setState] as const
}
