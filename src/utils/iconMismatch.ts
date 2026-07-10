import { getPresetFieldSections } from '@/utils/fieldOptions'
import type { DenormalizedPreset, FieldTranslations, RawFields } from '@/utils/types'

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
