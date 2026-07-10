import { isIconSvgConfirmedMissing } from '@/components/PageIcons/iconRegistry'
import {
  fieldOptionTitle,
  hasFieldOptionTranslation,
  type FieldOptionTranslation,
} from '@/utils/fieldOptionTranslation'
import { isOptionIconMismatch } from '@/utils/iconMismatch'
import type { DenormalizedPreset, FieldTranslations, RawField, RawFields } from '@/utils/types'

const REF_REGEX = /^\{(.*)\}$/

export function resolveFieldIcons(field: RawField, allFields: RawFields): Record<string, string> {
  if (field.iconsCrossReference) {
    const m = field.iconsCrossReference.match(REF_REGEX)
    if (m?.[1]) {
      const refField = allFields[m[1]]
      if (refField) return resolveFieldIcons(refField, allFields)
    }
  }
  const icons = field.icons ?? {}
  const resolved: Record<string, string> = {}
  for (const [opt, icon] of Object.entries(icons)) {
    if (typeof icon === 'string') {
      resolved[opt] = icon
    }
  }
  return resolved
}

export function getFieldOptionValues(
  field: RawField,
  fieldTranslations?: Record<string, { options?: Record<string, FieldOptionTranslation> }>,
  fieldId?: string,
): string[] {
  if (field.options?.length) return field.options
  const optionStrings = fieldId ? fieldTranslations?.[fieldId]?.options : undefined
  if (optionStrings) return Object.keys(optionStrings)
  return []
}

export type OptionIconUsage = {
  fieldId: string
  fieldKey: string
  optionValue: string
}

/** Map icon name → where it appears in field options across the schema. */
export function collectOptionIconUsages(
  fields: RawFields,
  presets: DenormalizedPreset[],
  fieldTranslations: FieldTranslations = {},
): Map<string, OptionIconUsage[]> {
  const usage = new Map<string, OptionIconUsage[]>()
  const fieldIdsUsed = new Set<string>()
  for (const preset of presets) {
    for (const fid of [...preset.fields, ...preset.moreFields]) {
      fieldIdsUsed.add(fid)
    }
  }

  for (const fieldId of fieldIdsUsed) {
    const field = fields[fieldId]
    if (!field) continue
    const icons = resolveFieldIcons(field, fields)
    const fieldKey = field.key ?? fieldId
    for (const opt of getFieldOptionValues(field, fieldTranslations, fieldId)) {
      const iconName = icons[opt]
      if (!iconName) continue
      const list = usage.get(iconName) ?? []
      list.push({ fieldId, fieldKey, optionValue: opt })
      usage.set(iconName, list)
    }
  }
  return usage
}

/** Unique option icons referenced by a single preset's fields. */
export function getPresetOptionIconNames(preset: DenormalizedPreset, fields: RawFields): string[] {
  const names = new Set<string>()
  for (const fieldId of [...preset.fields, ...preset.moreFields]) {
    const field = fields[fieldId]
    if (!field) continue
    for (const icon of Object.values(resolveFieldIcons(field, fields))) {
      names.add(icon)
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b))
}

export function findChildPresetForOption(
  preset: DenormalizedPreset,
  fieldKey: string,
  optionValue: string,
  presets: DenormalizedPreset[],
): DenormalizedPreset | undefined {
  const prefix = `${preset.id}/`
  const candidates = presets.filter(
    (p) => p.id.startsWith(prefix) && p.tags[fieldKey] === optionValue,
  )
  candidates.sort((a, b) => b.id.length - a.id.length)
  return candidates[0]
}

export type PresetOptionRow = {
  fieldId: string
  fieldKey: string
  optionValue: string
  icon?: string
  iconBroken: boolean
  /** Field option icon differs from the linked child preset icon. */
  iconMismatch: boolean
  labelEn: string
  childPreset?: { id: string; name: string; icon?: string }
  childPresetIcon?: string
}

export type FieldOptionMismatchRow = {
  optionValue: string
  optionIcon?: string
  labelEn: string
  iconMismatch: boolean
  parentPreset: { id: string; name: string }
  childPreset: { id: string; name: string; icon?: string }
}

export type PresetFieldSection = {
  fieldId: string
  fieldKey: string
  labelEn: string
  inPrimary: boolean
  inMore: boolean
  options: PresetOptionRow[]
}

function buildOptionRowsForField(
  preset: DenormalizedPreset,
  fieldId: string,
  field: RawField | undefined,
  fieldTranslations: FieldTranslations,
  allPresets: DenormalizedPreset[],
  allFields: RawFields,
): PresetOptionRow[] {
  if (!field) return []
  const options = getFieldOptionValues(field, fieldTranslations, fieldId)
  if (options.length === 0) return []

  const icons = resolveFieldIcons(field, allFields)
  const strings = fieldTranslations[fieldId]?.options ?? {}
  const fieldKey = field.key ?? fieldId
  const rows: PresetOptionRow[] = []

  for (const opt of options) {
    const icon = icons[opt]
    const child = findChildPresetForOption(preset, fieldKey, opt, allPresets)
    const childPresetIcon = child?.icon
    rows.push({
      fieldId,
      fieldKey,
      optionValue: opt,
      icon,
      iconBroken: icon ? isIconSvgConfirmedMissing(icon) : false,
      iconMismatch: isOptionIconMismatch(icon, childPresetIcon),
      labelEn: fieldOptionTitle(strings[opt]) ?? opt,
      childPreset: child ? { id: child.id, name: child.name, icon: childPresetIcon } : undefined,
      childPresetIcon,
    })
  }
  return rows
}

/** Fields on a preset with their option icons and labels — one section per field. */
export function getPresetFieldSections(
  preset: DenormalizedPreset,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  allPresets: DenormalizedPreset[],
): PresetFieldSection[] {
  const primarySet = new Set(preset.fields)
  const moreSet = new Set(preset.moreFields)
  const orderedIds: string[] = []
  for (const id of preset.fields) {
    if (!orderedIds.includes(id)) orderedIds.push(id)
  }
  for (const id of preset.moreFields) {
    if (!orderedIds.includes(id)) orderedIds.push(id)
  }

  return orderedIds.map((fieldId) => {
    const field = fields[fieldId]
    const fieldKey = field?.key ?? fieldId
    return {
      fieldId,
      fieldKey,
      labelEn: fieldTranslations[fieldId]?.label ?? fieldKey,
      inPrimary: primarySet.has(fieldId),
      inMore: moreSet.has(fieldId),
      options: buildOptionRowsForField(
        preset,
        fieldId,
        field,
        fieldTranslations,
        allPresets,
        fields,
      ),
    }
  })
}

/** Option rows with child presets for a field across every preset that uses it. */
export function getFieldOptionMismatchRows(
  fieldId: string,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  presets: DenormalizedPreset[],
): FieldOptionMismatchRow[] {
  const rows: FieldOptionMismatchRow[] = []

  for (const preset of presets) {
    if (!preset.fields.includes(fieldId) && !preset.moreFields.includes(fieldId)) continue
    const section = getPresetFieldSections(preset, fields, fieldTranslations, presets).find(
      (entry) => entry.fieldId === fieldId,
    )
    if (!section) continue

    for (const row of section.options) {
      if (!row.childPreset) continue
      rows.push({
        optionValue: row.optionValue,
        optionIcon: row.icon,
        labelEn: row.labelEn,
        iconMismatch: row.iconMismatch,
        parentPreset: { id: preset.id, name: preset.name },
        childPreset: row.childPreset,
      })
    }
  }

  return rows
}

/** Flat list of option rows (fields that define icons and/or option strings). */
export function getPresetOptionRows(
  preset: DenormalizedPreset,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  allPresets: DenormalizedPreset[],
): PresetOptionRow[] {
  return getPresetFieldSections(preset, fields, fieldTranslations, allPresets).flatMap((section) =>
    section.options.filter((row) => {
      const strings = fieldTranslations[section.fieldId]?.options ?? {}
      return Boolean(
        row.icon || hasFieldOptionTranslation(strings[row.optionValue]) || row.childPreset,
      )
    }),
  )
}
