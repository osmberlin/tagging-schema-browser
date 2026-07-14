import {
  getPresetFieldSections,
  type PresetFieldSection,
  type PresetOptionRow,
} from '@/utils/fieldOptions'
import type { DenormalizedPreset, FieldTranslations, RawFields } from '@/utils/types'

export type PresetIconMismatchRow = { section: PresetFieldSection; row: PresetOptionRow }

export type PresetIconMismatchRef = {
  parent: DenormalizedPreset
  section: PresetFieldSection
  row: PresetOptionRow
}

/** True when a field option and its child preset both define icons that differ. */
export function isOptionIconMismatch(
  optionIcon: string | undefined,
  childPresetIcon: string | undefined,
): boolean {
  if (!optionIcon || !childPresetIcon) return false
  return optionIcon !== childPresetIcon
}

/** Mark presets involved in any option ↔ child-preset icon mismatch. */
export function annotatePresetIconMismatches(
  presets: DenormalizedPreset[],
  fields: RawFields,
  fieldTranslations: FieldTranslations,
): void {
  const flagged = new Set<string>()

  for (const preset of presets) {
    const sections = getPresetFieldSections(preset, fields, fieldTranslations, presets)
    for (const section of sections) {
      for (const row of section.options) {
        if (!row.iconMismatch || !row.childPreset) continue
        flagged.add(preset.id)
        flagged.add(row.childPreset.id)
      }
    }
  }

  for (const preset of presets) {
    preset.iconMismatch = flagged.has(preset.id)
  }
}

/** Count mismatched option ↔ child-preset pairs per field id. */
export function computeFieldIconMismatchCounts(
  fields: RawFields,
  presets: DenormalizedPreset[],
  fieldTranslations: FieldTranslations,
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const preset of presets) {
    const sections = getPresetFieldSections(preset, fields, fieldTranslations, presets)
    for (const section of sections) {
      for (const row of section.options) {
        if (!row.iconMismatch) continue
        counts.set(section.fieldId, (counts.get(section.fieldId) ?? 0) + 1)
      }
    }
  }

  return counts
}

/** Mismatched option rows on this preset's own fields. */
export function getParentPresetIconMismatchRows(
  preset: DenormalizedPreset,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  allPresets: DenormalizedPreset[],
  precomputed?: Map<string, PresetIconMismatchRow[]>,
): PresetIconMismatchRow[] {
  if (precomputed) {
    return precomputed.get(preset.id) ?? []
  }
  return getPresetFieldSections(preset, fields, fieldTranslations, allPresets).flatMap((section) =>
    section.options.filter((row) => row.iconMismatch).map((row) => ({ section, row })),
  )
}

/** Parent field options whose child preset icon mismatches this preset. */
export function getChildPresetIconMismatchRefs(
  presetId: string,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  presets: DenormalizedPreset[],
  precomputed?: Map<string, PresetIconMismatchRef[]>,
): PresetIconMismatchRef[] {
  if (precomputed) {
    return precomputed.get(presetId) ?? []
  }
  return presets.flatMap((parent) =>
    getPresetFieldSections(parent, fields, fieldTranslations, presets).flatMap((section) =>
      section.options
        .filter((row) => row.childPreset?.id === presetId && row.iconMismatch)
        .map((row) => ({ parent, section, row })),
    ),
  )
}
