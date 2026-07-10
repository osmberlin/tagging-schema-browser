import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import {
  builderStateToSearchPatch,
  presetBuilderSearchSchema,
  searchToBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderSearch'
import type { PresetBuilderState } from '@/components/PagePresetBuilder/presetBuilderUtils'

export function usePresetBuilderState() {
  const search = useSearch({
    strict: false,
    structuralSharing: false,
    select: (raw) => presetBuilderSearchSchema.parse(raw),
  })
  const navigate = useNavigate()

  const state = useMemo(() => searchToBuilderState(search), [search])
  const fromPresetId = search.pb_from

  const setState = useCallback(
    (patch: Partial<PresetBuilderState>) => {
      const next = { ...state, ...patch }
      void navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          ...builderStateToSearchPatch(patch, state),
        }),
        replace: true,
      })
      return next
    },
    [navigate, state],
  )

  return { state, setState, fromPresetId, search }
}
