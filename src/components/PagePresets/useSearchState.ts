import { useQueryStates } from "nuqs";
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

const perPage = 24;

export const searchStateParsers = {
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(perPage),
  sort: parseAsStringLiteral(["name_asc", "name_desc"]).withDefault("name_asc"),
  primaryTagKey: parseAsArrayOf(parseAsString).withDefault([]),
  geometry: parseAsArrayOf(parseAsString).withDefault([]),
  iconPrefix: parseAsArrayOf(parseAsString).withDefault([]),
  iconName: parseAsArrayOf(parseAsString).withDefault([]),
  fieldIds: parseAsArrayOf(parseAsString).withDefault([]),
  categoryNames: parseAsArrayOf(parseAsString).withDefault([]),
  hasIcon: parseAsArrayOf(parseAsString).withDefault([]),
};

export type SearchState = {
  q: string;
  page: number;
  per_page: number;
  sort: "name_asc" | "name_desc";
  primaryTagKey: string[];
  geometry: string[];
  iconPrefix: string[];
  iconName: string[];
  fieldIds: string[];
  categoryNames: string[];
  hasIcon: string[];
};

export function useSearchState() {
  return useQueryStates(searchStateParsers, {
    shallow: true,
  });
}

export function filtersFromState(state: SearchState): Record<string, string[]> {
  const f: Record<string, string[]> = {};
  if (state.primaryTagKey.length) f.primaryTagKey = state.primaryTagKey;
  if (state.geometry.length) f.geometry = state.geometry;
  if (state.iconPrefix.length) f.iconPrefix = state.iconPrefix;
  if (state.iconName.length) f.iconName = state.iconName;
  if (state.fieldIds.length) f.fieldIds = state.fieldIds;
  if (state.categoryNames.length) f.categoryNames = state.categoryNames;
  if (state.hasIcon.length) f.hasIcon = state.hasIcon;
  return f;
}
