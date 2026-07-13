import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { z } from 'zod'

const stringArray = z.array(z.string()).catch([])

const triStateFacet = z.enum(['yes', 'no', 'both'])

/**
 * Search params for the presets page (route "/"), validated with Zod 4.
 * Every field uses `.catch(...)` so a malformed or missing URL param falls back
 * to its default instead of throwing — the URL is untrusted input.
 */
export const presetSearchSchema = z.object({
  q: z.string().catch(''),
  /** Used by the translations page for its own client-side list pagination. */
  page: z.number().int().positive().catch(1),
  sort: z.enum(['name_asc', 'name_desc']).catch('name_asc'),
  /** Template presets (`@templates/` or `@template` tag). Default hides them. */
  template: triStateFacet.catch('no'),
  /** `searchable: false` in preset JSON. Default shows all. */
  searchable: triStateFacet.catch('both'),
  primaryTagKey: stringArray,
  geometry: stringArray,
  iconPrefix: stringArray,
  iconName: stringArray,
  fieldIds: stringArray,
  primaryFieldIds: stringArray,
  moreFieldIds: stringArray,
  categoryNames: stringArray,
  hasIcon: stringArray,
  iconMismatch: stringArray,
  missingInheritance: stringArray,
})

export type SearchState = z.infer<typeof presetSearchSchema>

/** Fully-defaulted presets search — spread this when navigating to "/" with only a few params set. */
export const presetSearchDefaults: SearchState = presetSearchSchema.parse({})

/**
 * `[state, setState]` over the presets-page search params, backed by TanStack
 * Router. Reads non-strictly because the search bar / facet sidebar live in the
 * root layout (outside the route match) and would otherwise throw during
 * navigation transitions. `setState` shallow-merges a partial patch into the
 * current search (replacing history, like the previous nuqs setup).
 */
export function useSearchState() {
  // Parse the raw (possibly default-stripped) search through the schema so every
  // field is present with its default; the select result is memoized by the store.
  const state = useSearch({ strict: false, select: (raw) => presetSearchSchema.parse(raw) })
  const navigate = useNavigate()
  const setState = useCallback(
    (patch: Partial<SearchState>) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )
  return [state, setState] as const
}

/** Navigate to the full-page preset detail route (pushes history). */
export function useSetPreset() {
  const navigate = useNavigate()
  return useCallback(
    (id: string) => {
      void navigate({
        to: '/preset/$',
        params: { _splat: id },
        search: (prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' }),
      })
    },
    [navigate],
  )
}

export function filtersFromState(state: SearchState): Record<string, string[]> {
  const f: Record<string, string[]> = {}
  const nonEmpty = (values: string[]) => values.filter((value) => value.length > 0)
  if (nonEmpty(state.primaryTagKey).length) f.primaryTagKey = nonEmpty(state.primaryTagKey)
  if (nonEmpty(state.geometry).length) f.geometry = nonEmpty(state.geometry)
  if (nonEmpty(state.iconPrefix).length) f.iconPrefix = nonEmpty(state.iconPrefix)
  if (nonEmpty(state.iconName).length) f.iconName = nonEmpty(state.iconName)
  if (nonEmpty(state.fieldIds).length) f.fieldIds = nonEmpty(state.fieldIds)
  if (nonEmpty(state.primaryFieldIds).length) f.primaryFieldIds = nonEmpty(state.primaryFieldIds)
  if (nonEmpty(state.moreFieldIds).length) f.moreFieldIds = nonEmpty(state.moreFieldIds)
  if (nonEmpty(state.categoryNames).length) f.categoryFacet = nonEmpty(state.categoryNames)
  if (nonEmpty(state.hasIcon).length) f.hasIcon = nonEmpty(state.hasIcon)
  if (nonEmpty(state.iconMismatch).length) f.iconMismatch = nonEmpty(state.iconMismatch)
  if (nonEmpty(state.missingInheritance).length)
    f.missingInheritanceFacet = nonEmpty(state.missingInheritance)
  if (state.template !== 'both') f.template = [state.template]
  if (state.searchable !== 'both') f.searchable = [state.searchable]
  return f
}
