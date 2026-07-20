import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import {
  type PresetMatchSearch,
  presetMatchSearchSchema,
} from '@/components/PagePresetMatch/presetMatchSearch'

/** `[state, setState]` for `/preset-match` search params (tags, geometry, region). */
export function usePresetMatchSearch() {
  const state = useSearch({ strict: false, select: (raw) => presetMatchSearchSchema.parse(raw) })
  const navigate = useNavigate()
  const setState = useCallback(
    (patch: Partial<PresetMatchSearch>) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )
  return [state, setState] as const
}
