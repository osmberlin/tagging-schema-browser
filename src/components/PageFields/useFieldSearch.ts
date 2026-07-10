import { useMemo } from 'react'
import { sortFieldTypes } from '@/utils/fieldTypes'
import type {
  DenormalizedPreset,
  FieldTranslations,
  FieldViewModel,
  RawFields,
} from '@/utils/types'

function fieldLabel(
  id: string,
  raw: RawFields[string] | undefined,
  fieldTranslations: FieldTranslations,
): string {
  return fieldTranslations[id]?.label ?? ((typeof raw?.label === 'string' ? raw.label : '') || id)
}

export function useFieldSearch(
  fields: RawFields,
  presets: DenormalizedPreset[],
  fieldTranslations: FieldTranslations,
) {
  return useMemo(() => {
    const usage = new Map<
      string,
      { presets: DenormalizedPreset[]; primary: number; more: number }
    >()

    for (const preset of presets) {
      for (const fieldId of preset.fields) {
        const entry = usage.get(fieldId) ?? { presets: [], primary: 0, more: 0 }
        if (!entry.presets.some((p) => p.id === preset.id)) entry.presets.push(preset)
        entry.primary += 1
        usage.set(fieldId, entry)
      }
      for (const fieldId of preset.moreFields) {
        const entry = usage.get(fieldId) ?? { presets: [], primary: 0, more: 0 }
        if (!entry.presets.some((p) => p.id === preset.id)) entry.presets.push(preset)
        entry.more += 1
        usage.set(fieldId, entry)
      }
    }

    const fieldEntries: FieldViewModel[] = Object.entries(fields).map(([id, raw]) => {
      const used = usage.get(id)
      const presetsForField = used?.presets ?? []
      return {
        id,
        key: raw.key ?? id,
        type: raw.type ?? 'unknown',
        label: fieldLabel(id, raw, fieldTranslations),
        geometry: raw.geometry ?? [],
        universal: Boolean(raw.universal),
        usageCount: presetsForField.length,
        primaryCount: used?.primary ?? 0,
        moreCount: used?.more ?? 0,
        presets: presetsForField,
      }
    })

    const types = sortFieldTypes(fieldEntries.map((f) => f.type))

    return { fields: fieldEntries, types }
  }, [fields, presets, fieldTranslations])
}
