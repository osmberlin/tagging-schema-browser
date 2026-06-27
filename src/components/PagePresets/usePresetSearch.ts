import { useSchema } from "@/contexts/SchemaContext";
import { useMemo } from "react";
import { PRESET_SEARCH_ALL, searchPresets } from "./presetSearch";
import { filtersFromState, useSearchState } from "./useSearchState";

/** Faceted preset search for the presets page (table, sidebar facets, match count). */
export function usePresetSearch() {
  const { data } = useSchema();
  const [state] = useSearchState();
  const filters = useMemo(() => filtersFromState(state), [state]);
  return useMemo(() => {
    if (!data) return null;
    return searchPresets({
      query: state.q,
      filters,
      page: 1,
      per_page: PRESET_SEARCH_ALL,
      sort: state.sort,
    });
  }, [data, state.q, state.sort, filters]);
}
