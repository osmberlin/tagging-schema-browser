import { isPresetIconBroken, resolvePresetIconName } from "@/components/PageIcons/iconRegistry";
import type { DenormalizedPreset, FieldTranslations, RawField, RawFields } from "@/utils/types";

const REF_REGEX = /^\{(.*)\}$/;

export function resolveFieldIcons(field: RawField, allFields: RawFields): Record<string, string> {
  if (field.iconsCrossReference) {
    const m = field.iconsCrossReference.match(REF_REGEX);
    if (m?.[1]) {
      const refField = allFields[m[1]];
      if (refField) return resolveFieldIcons(refField, allFields);
    }
  }
  const icons = field.icons ?? {};
  const resolved: Record<string, string> = {};
  for (const [opt, icon] of Object.entries(icons)) {
    if (typeof icon === "string") {
      resolved[opt] = resolvePresetIconName(icon);
    }
  }
  return resolved;
}

export function getFieldOptionValues(field: RawField): string[] {
  return field.options ?? [];
}

export type OptionIconUsage = {
  fieldId: string;
  fieldKey: string;
  optionValue: string;
};

/** Map icon name → where it appears in field options across the schema. */
export function collectOptionIconUsages(
  fields: RawFields,
  presets: DenormalizedPreset[],
): Map<string, OptionIconUsage[]> {
  const usage = new Map<string, OptionIconUsage[]>();
  const fieldIdsUsed = new Set<string>();
  for (const preset of presets) {
    for (const fid of [...preset.fields, ...preset.moreFields]) {
      fieldIdsUsed.add(fid);
    }
  }

  for (const fieldId of fieldIdsUsed) {
    const field = fields[fieldId];
    if (!field) continue;
    const icons = resolveFieldIcons(field, fields);
    const fieldKey = field.key ?? fieldId;
    for (const opt of getFieldOptionValues(field)) {
      const iconName = icons[opt];
      if (!iconName) continue;
      const list = usage.get(iconName) ?? [];
      list.push({ fieldId, fieldKey, optionValue: opt });
      usage.set(iconName, list);
    }
  }
  return usage;
}

/** Unique option icons referenced by a single preset's fields. */
export function getPresetOptionIconNames(preset: DenormalizedPreset, fields: RawFields): string[] {
  const names = new Set<string>();
  for (const fieldId of [...preset.fields, ...preset.moreFields]) {
    const field = fields[fieldId];
    if (!field) continue;
    for (const icon of Object.values(resolveFieldIcons(field, fields))) {
      names.add(icon);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

export function presetHasBrokenOptionIcons(preset: DenormalizedPreset, fields: RawFields): boolean {
  return getPresetOptionIconNames(preset, fields).some((icon) => isPresetIconBroken(icon));
}

export function findChildPresetForOption(
  preset: DenormalizedPreset,
  fieldKey: string,
  optionValue: string,
  presets: DenormalizedPreset[],
): DenormalizedPreset | undefined {
  const prefix = `${preset.id}/`;
  const candidates = presets.filter(
    (p) => p.id.startsWith(prefix) && p.tags[fieldKey] === optionValue,
  );
  candidates.sort((a, b) => b.id.length - a.id.length);
  return candidates[0];
}

export type PresetOptionRow = {
  fieldId: string;
  fieldKey: string;
  optionValue: string;
  icon?: string;
  iconBroken: boolean;
  labelEn: string;
  childPreset?: { id: string; name: string };
};

/** Options with icons and/or labels for the preset detail view. */
export function getPresetOptionRows(
  preset: DenormalizedPreset,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  allPresets: DenormalizedPreset[],
): PresetOptionRow[] {
  const rows: PresetOptionRow[] = [];

  for (const fieldId of [...preset.fields, ...preset.moreFields]) {
    const field = fields[fieldId];
    if (!field) continue;
    const options = getFieldOptionValues(field);
    if (options.length === 0) continue;

    const icons = resolveFieldIcons(field, fields);
    const strings = fieldTranslations[fieldId]?.options ?? {};
    const fieldKey = field.key ?? fieldId;
    const hasIcons = Object.keys(icons).length > 0;
    const hasStrings = Object.keys(strings).length > 0;
    if (!hasIcons && !hasStrings) continue;

    for (const opt of options) {
      const icon = icons[opt];
      const child = findChildPresetForOption(preset, fieldKey, opt, allPresets);
      if (!icon && !strings[opt] && !child) continue;
      rows.push({
        fieldId,
        fieldKey,
        optionValue: opt,
        icon,
        iconBroken: icon ? isPresetIconBroken(icon) : false,
        labelEn: strings[opt] ?? opt,
        childPreset: child ? { id: child.id, name: child.name } : undefined,
      });
    }
  }
  return rows;
}
