import { isIconSvgConfirmedMissing } from '@/components/PageIcons/iconRegistry'
import {
  impliesPreset,
  isBetterChildPreset,
  optionLeadsToPreset,
  writesOptionViaAddTags,
} from '@/utils/childPresetMatch'
import {
  fieldOptionTitle,
  hasFieldOptionTranslation,
  type FieldOptionTranslation,
} from '@/utils/fieldOptionTranslation'
import { isOptionIconMismatch, isOptionIconMissing } from '@/utils/iconMismatch'
import { classifyLabelMismatch } from '@/utils/labelMismatch'
import type {
  ChildPresetIndex,
  DenormalizedPreset,
  PresetOptionChild,
  FieldOptionMismatchRow,
  FieldTranslations,
  RawField,
  RawFields,
} from '@/utils/types'

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

/** Icon names assigned to this field's actual option values (not every key in `icons`). */
export function listFieldOptionIconNames(
  fieldId: string,
  field: RawField,
  allFields: RawFields,
  fieldTranslations: FieldTranslations = {},
): string[] {
  const icons = resolveFieldIcons(field, allFields)
  const names = new Set<string>()
  for (const opt of getFieldOptionValues(field, fieldTranslations, fieldId)) {
    const iconName = icons[opt]
    if (iconName) names.add(iconName)
  }
  return [...names]
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
  childPresetIndex?: ChildPresetIndex,
): DenormalizedPreset | undefined {
  if (childPresetIndex) {
    return childPresetIndex.get(`${preset.id}\0${fieldKey}\0${optionValue}`)
  }
  const prefix = `${preset.id}/`
  let best: DenormalizedPreset | undefined
  let anyTagged: DenormalizedPreset | undefined
  for (const candidate of presets) {
    if (!candidate.id.startsWith(prefix) || candidate.tags[fieldKey] !== optionValue) continue
    if (isBetterChildPreset(candidate, anyTagged)) anyTagged = candidate
    if (!optionLeadsToPreset(preset, candidate, fieldKey, optionValue)) continue
    if (isBetterChildPreset(candidate, best)) best = candidate
  }
  if (!anyTagged) return undefined
  for (const candidate of presets) {
    if (candidate.id === preset.id || candidate.id.startsWith(prefix)) continue
    if (!writesOptionViaAddTags(candidate, fieldKey, optionValue)) continue
    if (isBetterChildPreset(candidate, anyTagged) && impliesPreset(anyTagged, candidate)) {
      best = candidate
      anyTagged = candidate
    }
  }
  return best
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
  childPreset?: PresetOptionChild
  childPresetIcon?: string
}

export type PresetFieldSection = {
  fieldId: string
  fieldKey: string
  labelEn: string
  inPrimary: boolean
  inMore: boolean
  options: PresetOptionRow[]
}

export function toOptionChild(
  child: DenormalizedPreset,
  fieldKey: string,
  optionValue: string,
): PresetOptionChild {
  return {
    id: child.id,
    name: child.name,
    icon: child.icon,
    ...(writesOptionViaAddTags(child, fieldKey, optionValue) ? { viaAddTags: true } : {}),
  }
}

function buildOptionRowsForField(
  preset: DenormalizedPreset,
  fieldId: string,
  field: RawField | undefined,
  fieldTranslations: FieldTranslations,
  allPresets: DenormalizedPreset[],
  allFields: RawFields,
  childPresetIndex?: ChildPresetIndex,
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
    const child = findChildPresetForOption(preset, fieldKey, opt, allPresets, childPresetIndex)
    const childPresetIcon = child?.icon
    rows.push({
      fieldId,
      fieldKey,
      optionValue: opt,
      icon,
      iconBroken: icon ? isIconSvgConfirmedMissing(icon) : false,
      iconMismatch: isOptionIconMismatch(icon, childPresetIcon),
      labelEn: fieldOptionTitle(strings[opt]) ?? opt,
      childPreset: child ? toOptionChild(child, fieldKey, opt) : undefined,
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
  childPresetIndex?: ChildPresetIndex,
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
        childPresetIndex,
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
  precomputed?: Map<string, FieldOptionMismatchRow[]>,
): FieldOptionMismatchRow[] {
  if (precomputed) {
    return precomputed.get(fieldId) ?? []
  }

  const rows: FieldOptionMismatchRow[] = []
  const field = fields[fieldId]
  const fieldHasIcons = field ? Object.keys(resolveFieldIcons(field, fields)).length > 0 : false

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
        iconMissing: isOptionIconMissing(row.icon, row.childPreset.icon, fieldHasIcons),
        labelMismatch: classifyLabelMismatch(
          fieldOptionTitle(fieldTranslations[fieldId]?.options?.[row.optionValue]),
          row.childPreset.name,
        ),
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
