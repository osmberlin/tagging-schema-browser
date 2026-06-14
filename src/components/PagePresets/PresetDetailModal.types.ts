import type { SearchState } from "@/components/PagePresets/useSearchState";

export type PresetFilterUpdate = Partial<
  Pick<
    SearchState,
    | "categoryNames"
    | "fieldIds"
    | "iconName"
    | "primaryTagKey"
    | "geometry"
    | "iconPrefix"
    | "hasIcon"
  >
>;
