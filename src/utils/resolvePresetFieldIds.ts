import { presetIdFromRef } from "@/components/PagePresets/presetFieldInheritance";
import type { RawPreset, RawPresets } from "@/utils/types";

function resolveFieldList(
  presetId: string,
  preset: RawPreset,
  fieldListKey: "fields" | "moreFields",
  rawPresets: RawPresets,
  seenPresetRefs: Set<string>,
): string[] {
  const list = preset[fieldListKey];
  if (!Array.isArray(list)) return [];

  const resolved: string[] = [];

  for (const item of list) {
    if (typeof item !== "string") continue;

    const nestedPresetId = presetIdFromRef(item);
    if (nestedPresetId) {
      if (seenPresetRefs.has(nestedPresetId)) continue;
      const nested = rawPresets[nestedPresetId];
      if (!nested) continue;

      seenPresetRefs.add(nestedPresetId);
      resolved.push(
        ...resolveFieldList(nestedPresetId, nested, "fields", rawPresets, seenPresetRefs),
        ...resolveFieldList(nestedPresetId, nested, "moreFields", rawPresets, seenPresetRefs),
      );
      seenPresetRefs.delete(nestedPresetId);
      continue;
    }

    resolved.push(item);
  }

  if (!resolved.length) {
    const endIndex = presetId.lastIndexOf("/");
    if (endIndex > 0) {
      const parentId = presetId.substring(0, endIndex);
      const parent = rawPresets[parentId];
      if (parent) {
        return resolveFieldList(parentId, parent, fieldListKey, rawPresets, seenPresetRefs);
      }
    }
  }

  return resolved;
}

/** Resolved field ids for a preset (fields + moreFields, including `{preset}` inheritance). */
export function resolvePresetFieldIds(
  presetId: string,
  preset: RawPreset,
  rawPresets: RawPresets,
): string[] {
  const seen = new Set<string>();
  const fields = resolveFieldList(presetId, preset, "fields", rawPresets, seen);
  const moreFields = resolveFieldList(presetId, preset, "moreFields", rawPresets, seen);
  return [...fields, ...moreFields];
}

export function fieldMatchesGeometry(
  field: { geometry?: string[] } | undefined,
  geometry: string,
): boolean {
  if (!field?.geometry?.length) return true;
  return field.geometry.includes(geometry);
}

const PREFIX_FIELD_TYPES = new Set(["multiCombo", "semiCombo", "manyCombo", "check"]);

/** Tag keys a field controls — mirrors a simplified iD `Field#allKeys`. */
export function getFieldTagKeys(
  fieldId: string,
  field: { key?: string; type?: string } | undefined,
  tags: Record<string, string>,
): string[] {
  const key = field?.key ?? fieldId;
  if (field?.type && PREFIX_FIELD_TYPES.has(field.type)) {
    return Object.keys(tags).filter((tagKey) => tagKey === key || tagKey.startsWith(`${key}:`));
  }
  return [key];
}
