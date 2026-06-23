import { isPresetIconBroken, resolvePresetIconName } from "@/components/PageIcons/iconRegistry";
import { nameRefFromRaw } from "@/components/PagePresets/presetLabelInheritance";
import type {
  DenormalizedPreset,
  RawCategories,
  RawFields,
  RawPresets,
  RawTranslations,
} from "@/utils/types";

const REF_REGEX = /^\{(.*)\}$/;

function getPresetName(
  presetId: string,
  raw: RawPresetRecord,
  translations: RawTranslations,
  allPresets: RawPresets,
): string {
  const t = translations.en?.presets?.presets?.[presetId]?.name;
  if (t) return t;
  const ref = raw.originalName ?? (raw as { name?: string }).name;
  if (ref && REF_REGEX.test(ref)) {
    const m = ref.match(REF_REGEX);
    if (m) {
      const resolved = allPresets[m[1]];
      if (resolved)
        return getPresetName(m[1], resolved as RawPresetRecord, translations, allPresets);
    }
  }
  return (ref as string) ?? presetId;
}

type RawPresetRecord = Record<string, unknown> & { originalName?: string };

function getTerms(
  presetId: string,
  raw: RawPresetRecord,
  translations: RawTranslations,
  allPresets: RawPresets,
): string[] {
  const nameRefId = nameRefFromRaw(raw);
  if (nameRefId) {
    const resolved = allPresets[nameRefId] as RawPresetRecord | undefined;
    if (resolved) {
      const inherited = getTerms(nameRefId, resolved, translations, allPresets);
      if (inherited.length) return inherited;
    }
  }

  const t = translations.en?.presets?.presets?.[presetId]?.terms;
  const str = (t ?? (raw as { terms?: string }).terms ?? "").trim();
  if (REF_REGEX.test(str)) {
    const m = str.match(REF_REGEX);
    if (m) {
      const resolved = allPresets[m[1]] as RawPresetRecord | undefined;
      if (resolved) return getTerms(m[1], resolved, translations, allPresets);
    }
  }
  return str
    .toLowerCase()
    .trim()
    .split(/\s*,+\s*/)
    .filter(Boolean);
}

function getAliases(
  presetId: string,
  raw: RawPresetRecord,
  translations: RawTranslations,
  allPresets: RawPresets,
): string[] {
  const nameRefId = nameRefFromRaw(raw);
  if (nameRefId) {
    const resolved = allPresets[nameRefId] as RawPresetRecord | undefined;
    if (resolved) {
      const inherited = getAliases(nameRefId, resolved, translations, allPresets);
      if (inherited.length) return inherited;
    }
  }

  const t = translations.en?.presets?.presets?.[presetId]?.aliases;
  const str = (t ?? (raw as { aliases?: string }).aliases ?? "").trim();
  if (REF_REGEX.test(str)) {
    const m = str.match(REF_REGEX);
    if (m) {
      const resolved = allPresets[m[1]] as RawPresetRecord | undefined;
      if (resolved) return getAliases(m[1], resolved, translations, allPresets);
    }
  }
  return str ? str.split(/\s*[\r\n]+\s*/).filter(Boolean) : [];
}

function resolveFieldIds(
  fieldIds: string[] | undefined,
  allPresets: RawPresets,
  allFields: RawFields,
  out: Set<string>,
  visited: Set<string>,
): void {
  if (!fieldIds) return;
  for (const id of fieldIds) {
    const refMatch = id.match(REF_REGEX);
    if (refMatch) {
      const presetId = refMatch[1];
      if (visited.has(presetId)) continue;
      visited.add(presetId);
      const preset = allPresets[presetId] as
        | { fields?: string[]; moreFields?: string[] }
        | undefined;
      if (preset) {
        resolveFieldIds(preset.fields, allPresets, allFields, out, visited);
        resolveFieldIds(preset.moreFields, allPresets, allFields, out, visited);
      }
      visited.delete(presetId);
    } else {
      out.add(id);
    }
  }
}

function iconPrefix(icon: string | undefined, imageURL?: string): string | undefined {
  if (icon) {
    if (icon.startsWith("fas-") || icon.startsWith("far-") || icon.startsWith("fab-"))
      return icon.slice(0, 3);
    const idx = icon.indexOf("-");
    return idx > 0 ? icon.slice(0, idx) : undefined;
  }
  if (imageURL) return "imageURL";
  return undefined;
}

function tagsToSearchString(tags: Record<string, string>): string {
  return Object.entries(tags)
    .map(([k, v]) => (v === "*" ? k : `${k}=${v}`))
    .join(" ");
}

export function denormalize(
  presets: RawPresets,
  translations: RawTranslations,
  categories: RawCategories,
  fields: RawFields,
): DenormalizedPreset[] {
  const categoryNames: Record<string, string> = {};
  for (const [cid] of Object.entries(categories)) {
    const name = translations.en?.presets?.categories?.[cid]?.name ?? cid;
    categoryNames[cid] = name;
  }

  const result: DenormalizedPreset[] = [];
  for (const [id, raw] of Object.entries(presets)) {
    const r = raw as RawPresetRecord & {
      icon?: string;
      imageURL?: string;
      fields?: string[];
      moreFields?: string[];
      geometry?: string[];
      tags?: Record<string, string>;
      matchScore?: number;
      searchable?: boolean;
    };
    const name = getPresetName(id, r, translations, presets);
    const terms = getTerms(id, r, translations, presets);
    const aliases = getAliases(id, r, translations, presets);
    const tags = r.tags ?? {};
    const tagEntries = Object.entries(tags);
    const primaryTagKey = tagEntries[0]?.[0];
    const primaryTagValue = tagEntries[0]?.[1];
    const geometry = r.geometry ?? [];
    const icon =
      typeof r.icon === "string" && r.icon.trim()
        ? resolvePresetIconName(r.icon.trim())
        : undefined;
    const imageURL =
      typeof r.imageURL === "string" && r.imageURL.trim() ? r.imageURL.trim() : undefined;
    const fieldSet = new Set<string>();
    resolveFieldIds(r.fields, presets, fields, fieldSet, new Set());
    const resolvedFields = Array.from(fieldSet);
    const moreSet = new Set<string>();
    resolveFieldIds(r.moreFields, presets, fields, moreSet, new Set());
    const resolvedMore = Array.from(moreSet);

    const categoryIds = Object.entries(categories)
      .filter(([, c]) => c.members?.includes(id))
      .map(([cid]) => cid);
    const categoryNamesList = categoryIds.map((cid) => categoryNames[cid] ?? cid);

    const iconBroken = isPresetIconBroken(icon);

    result.push({
      id,
      name,
      terms,
      aliases,
      icon,
      imageURL,
      iconPrefix: iconPrefix(icon, imageURL),
      geometry,
      tags,
      tagString: tagsToSearchString(tags),
      primaryTagKey,
      primaryTagValue,
      categoryIds,
      categoryNames: categoryNamesList,
      fields: resolvedFields.length ? resolvedFields : (r.fields ?? []),
      moreFields: resolvedMore.length ? resolvedMore : (r.moreFields ?? []),
      matchScore: r.matchScore ?? 1,
      hasIcon: Boolean(icon || imageURL),
      iconBroken,
      searchable: r.searchable !== false,
    });
  }
  return result;
}
