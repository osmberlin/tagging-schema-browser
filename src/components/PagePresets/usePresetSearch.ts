import { useSchema } from "@/contexts/SchemaContext";
import { useMemo } from "react";
import { searchPresets } from "./presetSearch";
import { filtersFromState, useSearchState } from "./useSearchState";

export function usePresetSearch() {
  const { data } = useSchema();
  const [state] = useSearchState();
  const filters = useMemo(() => filtersFromState(state), [state]);
  if (!data) return null;
  return searchPresets({
    query: state.q,
    filters,
    page: state.page,
    per_page: state.per_page,
    sort: state.sort,
  });
}
