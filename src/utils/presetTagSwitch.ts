import {
  fieldMatchesGeometry,
  getFieldTagKeys,
  resolvePresetFieldIds,
} from "@/utils/resolvePresetFieldIds";
import type { RawFields, RawPreset, RawPresets } from "@/utils/types";

export type TagRemovalReason = "removeTags" | "fieldKeys" | "both";

export type TagSwitchRow = {
  key: string;
  before: string | undefined;
  after: string | undefined;
  change: "added" | "removed" | "changed" | "unchanged";
  removalReason?: TagRemovalReason;
};

export type TagSwitchResult = {
  geometry: string;
  startingTags: Record<string, string>;
  endingTags: Record<string, string>;
  rows: TagSwitchRow[];
  usedFieldKeyRemoval: boolean;
};

function effectiveAddTags(preset: RawPreset): Record<string, string> {
  return { ...(preset.addTags ?? preset.tags ?? {}) };
}

function effectiveRemoveTags(preset: RawPreset): Record<string, string> {
  return { ...(preset.removeTags ?? preset.addTags ?? preset.tags ?? {}) };
}

function pickGeometry(oldPreset: RawPreset, newPreset: RawPreset): string {
  const oldGeom = oldPreset.geometry ?? [];
  const newGeom = newPreset.geometry ?? [];
  const shared = oldGeom.find((g) => newGeom.includes(g));
  if (shared) return shared;
  return newGeom[0] ?? oldGeom[0] ?? "area";
}

function presetMatchScore(preset: RawPreset, tags: Record<string, string>): number {
  const presetTags = preset.tags ?? {};
  for (const [key, value] of Object.entries(presetTags)) {
    if (tags[key] !== value) return -1;
  }
  return Object.keys(presetTags).length;
}

function unsetTags(
  preset: RawPreset,
  tags: Record<string, string>,
  preserveKeys: string[],
): Record<string, string> {
  const removeTags = effectiveRemoveTags(preset);
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (key === "area") continue;
    if (!Object.hasOwn(removeTags, key) || preserveKeys.includes(key)) {
      result[key] = value;
    }
  }

  return result;
}

function setTags(
  preset: RawPreset,
  tags: Record<string, string>,
  _geometry: string,
): Record<string, string> {
  const addTags = effectiveAddTags(preset);
  const result = { ...tags };

  for (const [key, value] of Object.entries(addTags)) {
    if (value === "*") {
      if (preset.tags?.[key] || !result[key]) {
        result[key] = "yes";
      }
    } else {
      result[key] = value;
    }
  }

  if (!Object.hasOwn(addTags, "area")) {
    const { area: _area, ...withoutArea } = result;
    return withoutArea;
  }

  return result;
}

function collectPreserveKeys(
  oldPresetId: string,
  oldPreset: RawPreset,
  newPresetId: string,
  newPreset: RawPreset,
  tags: Record<string, string>,
  geometry: string,
  rawPresets: RawPresets,
  fields: RawFields,
): string[] {
  const preserveKeys = new Set(Object.keys(effectiveAddTags(newPreset)));
  const wasSubPreset = oldPresetId !== newPresetId && oldPresetId.startsWith(`${newPresetId}/`);

  for (const fieldId of resolvePresetFieldIds(newPresetId, newPreset, rawPresets)) {
    const field = fields[fieldId];
    if (!fieldMatchesGeometry(field, geometry)) continue;

    for (const key of getFieldTagKeys(fieldId, field, tags)) {
      if (wasSubPreset && oldPreset.tags?.[key] !== undefined) continue;
      preserveKeys.add(key);
    }
  }

  return [...preserveKeys];
}

function trackUnsetRemovals(
  before: Record<string, string>,
  after: Record<string, string>,
  reasons: Map<string, TagRemovalReason>,
) {
  for (const key of Object.keys(before)) {
    if (before[key] !== undefined && after[key] === undefined) {
      const existing = reasons.get(key);
      reasons.set(key, existing === "fieldKeys" ? "both" : "removeTags");
    }
  }
}

function buildRows(
  startingTags: Record<string, string>,
  endingTags: Record<string, string>,
  removalReasons: Map<string, TagRemovalReason>,
): TagSwitchRow[] {
  const keys = new Set([...Object.keys(startingTags), ...Object.keys(endingTags)]);
  const rows: TagSwitchRow[] = [];

  for (const key of [...keys].sort()) {
    const before = startingTags[key];
    const after = endingTags[key];
    let change: TagSwitchRow["change"];
    if (before === undefined && after !== undefined) change = "added";
    else if (before !== undefined && after === undefined) change = "removed";
    else if (before !== after) change = "changed";
    else change = "unchanged";

    rows.push({
      key,
      before,
      after,
      change,
      removalReason: change === "removed" ? removalReasons.get(key) : undefined,
    });
  }

  return rows;
}

/**
 * Simulate iD's `actionChangePreset` tag updates when switching presets.
 * Assumes the feature currently has all tags from preset 1's `addTags` (or `tags`).
 *
 * @see https://github.com/openstreetmap/iD/blob/develop/modules/actions/change_preset.js
 */
export function simulatePresetTagSwitch(
  oldPresetId: string,
  newPresetId: string,
  rawPresets: RawPresets,
  fields: RawFields,
): TagSwitchResult | null {
  const oldPreset = rawPresets[oldPresetId];
  const newPreset = rawPresets[newPresetId];
  if (!oldPreset || !newPreset) return null;

  const geometry = pickGeometry(oldPreset, newPreset);
  const startingTags = effectiveAddTags(oldPreset);
  let tags = { ...startingTags };
  const removalReasons = new Map<string, TagRemovalReason>();
  let usedFieldKeyRemoval = false;

  const preserveKeys = collectPreserveKeys(
    oldPresetId,
    oldPreset,
    newPresetId,
    newPreset,
    tags,
    geometry,
    rawPresets,
    fields,
  );

  if (oldPresetId !== newPresetId) {
    const oldFieldKeys = resolvePresetFieldIds(oldPresetId, oldPreset, rawPresets).flatMap(
      (fieldId) => {
        const field = fields[fieldId];
        if (!fieldMatchesGeometry(field, geometry)) return [];
        return getFieldTagKeys(fieldId, field, tags);
      },
    );

    const fieldKeysToRemove = [...new Set(oldFieldKeys)].filter(
      (key) => !preserveKeys.includes(key),
    );

    let reducedTags = { ...tags };
    for (const key of fieldKeysToRemove) {
      if (key in reducedTags) {
        removalReasons.set(key, "fieldKeys");
        const { [key]: _removed, ...rest } = reducedTags;
        reducedTags = rest;
      }
    }

    const beforeUnset = { ...reducedTags };
    reducedTags = unsetTags(oldPreset, reducedTags, preserveKeys);
    trackUnsetRemovals(beforeUnset, reducedTags, removalReasons);
    reducedTags = setTags(newPreset, reducedTags, geometry);

    if (presetMatchScore(oldPreset, reducedTags) === -1) {
      tags = reducedTags;
      usedFieldKeyRemoval = fieldKeysToRemove.length > 0;
    } else {
      for (const key of fieldKeysToRemove) {
        removalReasons.delete(key);
      }
    }
  }

  const beforeFinalUnset = { ...tags };
  tags = unsetTags(oldPreset, tags, preserveKeys);
  trackUnsetRemovals(beforeFinalUnset, tags, removalReasons);
  tags = setTags(newPreset, tags, geometry);

  return {
    geometry,
    startingTags,
    endingTags: tags,
    rows: buildRows(startingTags, tags, removalReasons),
    usedFieldKeyRemoval,
  };
}

export function effectiveRemoveTagsForPreset(preset: RawPreset): Record<string, string> {
  return effectiveRemoveTags(preset);
}

export function hasExplicitRemoveTags(preset: RawPreset): boolean {
  return preset.removeTags !== undefined;
}
