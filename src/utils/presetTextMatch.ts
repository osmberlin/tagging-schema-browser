import type { LocaleEntry } from "@/components/PageTranslations/useLocaleData";
import type { DenormalizedPreset } from "@/utils/types";

export type PresetTextMatchOptions = {
  locale?: LocaleEntry;
  includeTranslationKeys?: boolean;
};

function presetTranslationKeys(id: string): string[] {
  return [
    `presets.presets.${id}.name`,
    `presets.presets.${id}.terms`,
    `presets.presets.${id}.aliases`,
  ];
}

/** Lowercased searchable text for a preset (and optional locale overlay). */
export function buildPresetHaystack(
  p: DenormalizedPreset,
  options?: PresetTextMatchOptions,
): string {
  const idSegment = p.id.includes("/") ? (p.id.split("/").pop() ?? p.id) : p.id;
  const parts = [
    p.name,
    p.id,
    idSegment,
    p.id.replaceAll("/", " "),
    p.tagString,
    ...p.terms,
    ...p.aliases,
    ...p.fields,
    ...p.moreFields,
  ];

  if (options?.includeTranslationKeys) {
    parts.push(...presetTranslationKeys(p.id));
  }

  const loc = options?.locale;
  if (loc) {
    if (loc.name) parts.push(loc.name);
    parts.push(...loc.terms, ...loc.aliases);
  }

  return parts.join(" ").toLowerCase();
}

export function presetMatchesTextQuery(
  p: DenormalizedPreset,
  query: string,
  options?: PresetTextMatchOptions,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return buildPresetHaystack(p, options).includes(q);
}

/** Default translations list: searchable presets with a display name. */
export function isDefaultTranslationPreset(p: DenormalizedPreset): boolean {
  return Boolean(p.name) && p.searchable !== false;
}

/** Translations list eligibility: default set, or any named preset when searching. */
export function isTranslationPresetEligible(p: DenormalizedPreset, query: string): boolean {
  if (!p.name) return false;
  return query.trim() ? true : p.searchable !== false;
}
