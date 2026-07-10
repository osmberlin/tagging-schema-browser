import { fieldOptionTitle } from '@/utils/fieldOptionTranslation'
import type { FieldTranslations, IconViewModel, RawFields } from '@/utils/types'

export type IconUsageRow = {
  iconName: string
  kind: 'preset' | 'option'
  label: string
  code: string
  presetId?: string
  fieldId?: string
}

function fieldLabel(
  fieldId: string,
  field: RawFields[string] | undefined,
  fieldTranslations: FieldTranslations,
): string {
  return (
    fieldTranslations[fieldId]?.label ??
    ((typeof field?.label === 'string' ? field.label : '') || fieldId)
  )
}

function optionUsageLabel(
  fieldId: string,
  optionValue: string,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
): string {
  const label = fieldLabel(fieldId, fields[fieldId], fieldTranslations)
  const optionTitle = fieldOptionTitle(fieldTranslations[fieldId]?.options?.[optionValue])
  return optionTitle ? `${label} — ${optionTitle}` : label
}

/** One row per preset or field-option reference, preserving icon sort order from the caller. */
export function flattenIconUsages(
  icons: IconViewModel[],
  fields: RawFields,
  fieldTranslations: FieldTranslations,
): IconUsageRow[] {
  const rows: IconUsageRow[] = []

  for (const icon of icons) {
    const presets = [...icon.presets].sort(
      (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    )
    for (const preset of presets) {
      rows.push({
        iconName: icon.name,
        kind: 'preset',
        label: preset.name,
        code: preset.id,
        presetId: preset.id,
      })
    }

    const options = [...icon.optionUsages].sort(
      (a, b) => a.fieldKey.localeCompare(b.fieldKey) || a.optionValue.localeCompare(b.optionValue),
    )
    for (const option of options) {
      rows.push({
        iconName: icon.name,
        kind: 'option',
        label: optionUsageLabel(option.fieldId, option.optionValue, fields, fieldTranslations),
        code: `${option.fieldKey}=${option.optionValue}`,
        fieldId: option.fieldId,
      })
    }
  }

  return rows
}
