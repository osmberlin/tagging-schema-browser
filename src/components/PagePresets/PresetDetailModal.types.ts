import type { SearchState } from "@/components/PagePresets/useSearchState";

export type PresetFilterUpdate = Partial<
  Pick<
    SearchState,
    | "categoryNames"
    | "fieldIds"
    | "primaryFieldIds"
    | "moreFieldIds"
    | "iconName"
    | "primaryTagKey"
    | "geometry"
    | "iconPrefix"
    | "hasIcon"
  >
>;
