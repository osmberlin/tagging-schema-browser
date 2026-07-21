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
 * Draft state lives in TanStack Form. The URL is a committed snapshot updated on
 * blur (or discrete toggles) via navigate with `resetScroll: false`. The form is
 * only reset when the URL changes externally (initial load, back/forward, prefill)
 * — never after our own commits.
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

  const lastHydratedKeyRef = useRef<string | null>(null)
  const editingRef = useRef(false)

  const form = useForm({
    defaultValues: committedState,
  })
  const formRef = useRef(form)
  formRef.current = form

  const markEditing = useCallback(() => {
    editingRef.current = true
  }, [])

  const commitToUrl = useCallback(
    (values: PresetBuilderState) => {
      editingRef.current = false
      if (builderStatesEqual(values, committedStateRef.current)) return

      const nextKey = JSON.stringify(values)
      lastHydratedKeyRef.current = nextKey

      void navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          ...builderStateToSearch(values, fromPresetId),
        }),
        replace: true,
        resetScroll: false,
      })
    },
    [navigate, fromPresetId],
  )

  // Hydrate from URL only on external changes (not while the user is editing).
  useEffect(() => {
    if (lastHydratedKeyRef.current === committedKey) return
    if (editingRef.current) return

    const committed = committedStateRef.current
    if (builderStatesEqual(formRef.current.state.values, committed)) {
      lastHydratedKeyRef.current = committedKey
      return
    }

    formRef.current.reset(committed)
    lastHydratedKeyRef.current = committedKey
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

  const setFieldValue = useCallback(
    <K extends keyof PresetBuilderState>(key: K, value: PresetBuilderState[K]) => {
      editingRef.current = true
      formRef.current.setFieldValue(key, value as never)
    },
    [],
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
    setFieldValue,
    markEditing,
    defaults: PRESET_BUILDER_DEFAULTS,
  }
}
