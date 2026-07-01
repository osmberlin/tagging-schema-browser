import {
  fieldMatchesGeometry,
  getAssumedTagsForField,
  getFieldTagKeys,
  resolvePresetFieldIds,
} from "@/utils/resolvePresetFieldIds";
import type { RawFields, RawPreset, RawPresets } from "@/utils/types";

export type TagRemovalCause = "fieldKeys" | "removeTags" | "both";

export type TagSwitchAction =
  | "nothing"
  | "change based on preset"
  | "remove due to missing in new/second preset"
  | "remove due to removeTags in source/first preset";

export type TagSwitchRow = {
  key: string;
  before: string | undefined;
  after: string | undefined;
  action: TagSwitchAction;
};

export type TagSwitchResult = {
  geometry: string;
  startingTags: Record<string, string>;
  endingTags: Record<string, string>;
  rows: TagSwitchRow[];
  usedFieldKeyRemoval: boolean;
  fieldCount: number;
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

function buildStartingTags(
  presetId: string,
  preset: RawPreset,
  rawPresets: RawPresets,
  fields: RawFields,
  geometry: string,
): Record<string, string> {
  const tags = { ...effectiveAddTags(preset) };

  for (const fieldId of resolvePresetFieldIds(presetId, preset, rawPresets)) {
    const field = fields[fieldId];
    if (!fieldMatchesGeometry(field, geometry)) continue;
    for (const [key, value] of Object.entries(getAssumedTagsForField(fieldId, field))) {
      if (!(key in tags)) tags[key] = value;
    }
  }

  return tags;
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
  reasons: Map<string, TagRemovalCause>,
) {
  for (const key of Object.keys(before)) {
    if (before[key] !== undefined && after[key] === undefined) {
      const existing = reasons.get(key);
      reasons.set(key, existing === "fieldKeys" ? "both" : "removeTags");
    }
  }
}

function actionForRow(
  before: string | undefined,
  after: string | undefined,
  removalCause?: TagRemovalCause,
): TagSwitchAction {
  if (before !== undefined && after !== undefined && before === after) return "nothing";
  if (before !== undefined && after === undefined) {
    if (removalCause === "fieldKeys" || removalCause === "both") {
      return "remove due to missing in new/second preset";
    }
    return "remove due to removeTags in source/first preset";
  }
  if (before === undefined && after === undefined) return "nothing";
  return "change based on preset";
}

function buildRows(
  startingTags: Record<string, string>,
  endingTags: Record<string, string>,
  removalCauses: Map<string, TagRemovalCause>,
): TagSwitchRow[] {
  const keys = new Set([...Object.keys(startingTags), ...Object.keys(endingTags)]);

  return [...keys].sort().map((key) => {
    const before = startingTags[key];
    const after = endingTags[key];
    const removalCause =
      before !== undefined && after === undefined ? removalCauses.get(key) : undefined;
    return {
      key,
      before,
      after,
      action: actionForRow(before, after, removalCause),
    };
  });
}

/**
 * Simulate iD's `actionChangePreset` tag updates when switching presets.
 * Assumes preset 1's `addTags`/`tags` plus every field key on preset 1 is populated.
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
  const startingTags = buildStartingTags(oldPresetId, oldPreset, rawPresets, fields, geometry);
  const fieldCount = resolvePresetFieldIds(oldPresetId, oldPreset, rawPresets).filter((fieldId) =>
    fieldMatchesGeometry(fields[fieldId], geometry),
  ).length;

  let tags = { ...startingTags };
  const removalCauses = new Map<string, TagRemovalCause>();
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
        return getFieldTagKeys(fieldId, field, tags).filter((key) => key in tags);
      },
    );

    const fieldKeysToRemove = [...new Set(oldFieldKeys)].filter(
      (key) => !preserveKeys.includes(key),
    );

    let reducedTags = { ...tags };
    for (const key of fieldKeysToRemove) {
      if (key in reducedTags) {
        removalCauses.set(key, "fieldKeys");
        const { [key]: _removed, ...rest } = reducedTags;
        reducedTags = rest;
      }
    }

    const beforeUnset = { ...reducedTags };
    reducedTags = unsetTags(oldPreset, reducedTags, preserveKeys);
    trackUnsetRemovals(beforeUnset, reducedTags, removalCauses);
    reducedTags = setTags(newPreset, reducedTags, geometry);

    if (presetMatchScore(oldPreset, reducedTags) === -1) {
      tags = reducedTags;
      usedFieldKeyRemoval = fieldKeysToRemove.length > 0;
    } else {
      for (const key of fieldKeysToRemove) {
        removalCauses.delete(key);
      }
    }
  }

  const beforeFinalUnset = { ...tags };
  tags = unsetTags(oldPreset, tags, preserveKeys);
  trackUnsetRemovals(beforeFinalUnset, tags, removalCauses);
  tags = setTags(newPreset, tags, geometry);

  return {
    geometry,
    startingTags,
    endingTags: tags,
    rows: buildRows(startingTags, tags, removalCauses),
    usedFieldKeyRemoval,
    fieldCount,
  };
}

export function effectiveRemoveTagsForPreset(preset: RawPreset): Record<string, string> {
  return effectiveRemoveTags(preset);
}

export function hasExplicitRemoveTags(preset: RawPreset): boolean {
  return preset.removeTags !== undefined;
}
