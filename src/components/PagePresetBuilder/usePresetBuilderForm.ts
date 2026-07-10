import { useForm, useStore } from '@tanstack/react-form'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  builderStateToSearch,
  presetBuilderSearchSchema,
  searchToBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderSearch'
import {
  PRESET_BUILDER_DEFAULTS,
  type PresetBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderTypes'
import { builderStatesEqual } from '@/components/PagePresetBuilder/presetBuilderUtils'

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
  const formRef = useRef(form)
  formRef.current = form

  const commitToUrl = useCallback(
    (values: PresetBuilderState) => {
      if (builderStatesEqual(values, committedStateRef.current)) return
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
    [navigate, fromPresetId],
  )

  // Hydrate the form when the URL changes externally (initial load, back/forward, prefill).
  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false
      return
    }
    const committed = committedStateRef.current
    if (builderStatesEqual(formRef.current.state.values, committed)) return
    formRef.current.reset(committed)
  }, [committedKey])

  const formValues = useStore(form.store, (state) => state.values)
  const hasUnsavedEdits = !builderStatesEqual(formValues, committedState)

  const commitDraft = useCallback(() => {
    commitToUrl(formRef.current.state.values)
  }, [commitToUrl])

  const commitAndSet = useCallback(
    (key: keyof PresetBuilderState, value: PresetBuilderState[keyof PresetBuilderState]) => {
      const next = { ...formRef.current.state.values, [key]: value } as PresetBuilderState
      formRef.current.setFieldValue(key, value as never)
      commitToUrl(next)
    },
    [commitToUrl],
  )

  return {
    form,
    committedState,
    committedKey,
    fromPresetId,
    isDirty: hasUnsavedEdits,
    commitToUrl,
    commitDraft,
    commitAndSet,
    defaults: PRESET_BUILDER_DEFAULTS,
  }
}
