import { useIconRegistryEpoch } from '@/components/PageIcons/iconRegistry'
import { useSchema } from '@/hooks/useSchema'
import { ensurePresetSearchIndex, PRESET_SEARCH_ALL, searchPresets } from './presetSearch'
import { filtersFromState, useSearchState } from './useSearchState'

/** Faceted preset search for the presets page (table, sidebar facets, match count). */
export function usePresetSearch() {
  const { data, dataUrl } = useSchema()
  const [state] = useSearchState()
  useIconRegistryEpoch()
  if (!data) return null
  ensurePresetSearchIndex(dataUrl, data.presets)
  return searchPresets({
    query: state.q,
    filters: filtersFromState(state),
    page: 1,
    per_page: PRESET_SEARCH_ALL,
    sort: state.sort,
  })
}
