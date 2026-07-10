import { useForm, useStore } from '@tanstack/react-form'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  builderStateToSearch,
  presetBuilderSearchSchema,
  searchToBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderSearch'
import {
  type PresetBuilderState,
  PRESET_BUILDER_DEFAULTS,
  builderStatesEqual,
} from '@/components/PagePresetBuilder/presetBuilderUtils'

/**
 * TanStack Form holds draft values while typing. The URL (TanStack Router search
 * params) is the committed, shareable state — updated on blur or discrete
 * control changes, not on every keystroke (avoids navigate-induced resets).
 */
export function usePresetBuilderForm() {
  const search = useSearch({
    strict: false,
    structuralSharing: false,
    select: (raw) => presetBuilderSearchSchema.parse(raw),
  })
  const navigate = useNavigate()
  const fromPresetId = search.pb_from

  const committedState = useMemo(() => searchToBuilderState(search), [search])
  const committedKey = useMemo(() => JSON.stringify(committedState), [committedState])
  const committedStateRef = useRef(committedState)
  committedStateRef.current = committedState
  const skipResetRef = useRef(false)

  const form = useForm({
    defaultValues: committedState,
  })

  const commitToUrl = useCallback(
    (values: PresetBuilderState) => {
      if (builderStatesEqual(values, committedState)) return
      skipResetRef.current = true
      void navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          ...builderStateToSearch(values, fromPresetId),
        }),
        replace: true,
      })
    },
    [navigate, fromPresetId, committedState],
  )

  // Hydrate the form when the URL changes (initial load, back/forward, prefill).
  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false
      return
    }
    form.reset(committedStateRef.current)
    // committedKey tracks serialized URL state; avoid depending on committedState
    // object identity, which changes when the router re-parses search each render.
  }, [committedKey, form])

  const isDirty = useStore(form.store, (state) => !builderStatesEqual(state.values, committedState))

  const commitFieldBlur = useCallback(() => {
    commitToUrl(form.state.values)
  }, [commitToUrl, form])

  const commitAndSet = useCallback(
    (key: keyof PresetBuilderState, value: PresetBuilderState[keyof PresetBuilderState]) => {
      const next = { ...form.state.values, [key]: value } as PresetBuilderState
      form.setFieldValue(key, value as never)
      commitToUrl(next)
    },
    [commitToUrl, form],
  )

  return {
    form,
    committedState,
    fromPresetId,
    isDirty,
    commitToUrl,
    commitFieldBlur,
    commitAndSet,
    defaults: PRESET_BUILDER_DEFAULTS,
  }
}
