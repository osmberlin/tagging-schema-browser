import { presetIdFromRef } from "@/components/PagePresets/presetFieldInheritance";
import type { RawField, RawPreset, RawPresets } from "@/utils/types";

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

function firstOption(field: RawField): string {
  const opt = field.options?.find((o) => o !== "undefined");
  return opt ?? "yes";
}

/** Placeholder tags for a field — every key the field can edit is set as if the user filled it in. */
export function getAssumedTagsForField(
  fieldId: string,
  field: RawField | undefined,
): Record<string, string> {
  if (!field) return { [fieldId]: "…" };

  const type = field.type;
  const value = firstOption(field);

  if (type === "structureRadio") {
    const structureKey = field.options?.[0] ?? field.keys?.[0] ?? "bridge";
    return { [structureKey]: "yes" };
  }

  if (field.keys?.length) {
    const tags: Record<string, string> = {};
    for (const key of field.keys) {
      tags[key] = value;
    }
    return tags;
  }

  const key = field.key ?? fieldId;

  if (type && PREFIX_FIELD_TYPES.has(type)) {
    const tags: Record<string, string> = {};
    if (field.options?.length) {
      for (const opt of field.options) {
        if (opt === "undefined") continue;
        tags[`${key}:${opt}`] = "yes";
      }
    }
    if (Object.keys(tags).length === 0) tags[key] = "yes";
    return tags;
  }

  if (type === "check" || type === "onewayCheck") {
    return { [key]: "yes" };
  }

  return { [key]: value };
}

/** Tag keys a field currently controls — mirrors a simplified iD `Field#allKeys`. */
export function getFieldTagKeys(
  fieldId: string,
  field: RawField | undefined,
  tags: Record<string, string>,
): string[] {
  if (!field) return [fieldId];

  if (field.keys?.length) {
    return field.keys.filter((key) => key in tags);
  }

  const key = field.key ?? fieldId;

  if (field.type === "structureRadio") {
    const candidates = field.keys ?? field.options ?? [];
    return candidates.filter((k) => k in tags);
  }

  if (field.type && PREFIX_FIELD_TYPES.has(field.type)) {
    return Object.keys(tags).filter((tagKey) => tagKey === key || tagKey.startsWith(`${key}:`));
  }

  return key in tags ? [key] : [key];
}
