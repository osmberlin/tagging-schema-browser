import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

const PER_PAGE = 24;

const stringArray = z.array(z.string()).catch([]);

/**
 * Search params for the presets page (route "/"), validated with Zod 4.
 * Every field uses `.catch(...)` so a malformed or missing URL param falls back
 * to its default instead of throwing — the URL is untrusted input.
 */
export const presetSearchSchema = z.object({
  q: z.string().catch(""),
  page: z.number().int().positive().catch(1),
  per_page: z.number().int().positive().catch(PER_PAGE),
  sort: z.enum(["name_asc", "name_desc"]).catch("name_asc"),
  primaryTagKey: stringArray,
  geometry: stringArray,
  iconPrefix: stringArray,
  iconName: stringArray,
  fieldIds: stringArray,
  categoryNames: stringArray,
  hasIcon: stringArray,
});

export type SearchState = z.infer<typeof presetSearchSchema>;

/** Fully-defaulted presets search — spread this when navigating to "/" with only a few params set. */
export const presetSearchDefaults: SearchState = presetSearchSchema.parse({});

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
  const state = useSearch({ strict: false, select: (raw) => presetSearchSchema.parse(raw) });
  const navigate = useNavigate();
  const setState = useCallback(
    (patch: Partial<SearchState>) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true });
    },
    [navigate],
  );
  return [state, setState] as const;
}

/** Navigate to the full-page preset detail route (pushes history). */
export function useSetPreset() {
  const navigate = useNavigate();
  return useCallback(
    (id: string) => {
      void navigate({
        to: "/preset/$",
        params: { _splat: id },
        search: (prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" }),
      });
    },
    [navigate],
  );
}

export function filtersFromState(state: SearchState): Record<string, string[]> {
  const f: Record<string, string[]> = {};
  if (state.primaryTagKey.length) f.primaryTagKey = state.primaryTagKey;
  if (state.geometry.length) f.geometry = state.geometry;
  if (state.iconPrefix.length) f.iconPrefix = state.iconPrefix;
  if (state.iconName.length) f.iconName = state.iconName;
  if (state.fieldIds.length) f.fieldIds = state.fieldIds;
  if (state.categoryNames.length) f.categoryFacet = state.categoryNames;
  if (state.hasIcon.length) f.hasIcon = state.hasIcon;
  return f;
}
