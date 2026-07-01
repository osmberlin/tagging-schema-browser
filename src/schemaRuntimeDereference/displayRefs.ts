import { isReference } from '@/schemaRuntimeDereference/references'
import type { FieldTranslations, RawFields } from '@/utils/types'

export type FieldRefDisplay = {
  ref: string
  refFieldId: string
  /** Human-readable dereferenced value for the source JSON viewer. */
  resolved: string
}

const FIELD_CROSS_REF_KEYS = new Set([
  'label',
  'placeholder',
  'stringsCrossReference',
  'iconsCrossReference',
])

export function isFieldCrossRefKey(keyName: string): boolean {
  return FIELD_CROSS_REF_KEYS.has(keyName)
}

/** Resolve a field cross-reference for display in the source JSON tree. */
export function resolveFieldRefDisplay(
  contextFieldId: string,
  keyName: string,
  rawValue: string,
  fields: RawFields,
  fieldTranslations: FieldTranslations,
): FieldRefDisplay | null {
  if (!isFieldCrossRefKey(keyName) || !isReference(rawValue)) return null

  const refFieldId = rawValue.slice(1, -1)

  if (keyName === 'label' || keyName === 'placeholder') {
    const resolved =
      fieldTranslations[contextFieldId]?.[keyName] ?? fieldTranslations[refFieldId]?.[keyName]
    if (!resolved || resolved === rawValue) return null
    return { ref: rawValue, refFieldId, resolved }
  }

  if (keyName === 'stringsCrossReference') {
    const refTrans = fieldTranslations[refFieldId]
    const label = refTrans?.label ?? refFieldId
    const optCount = Object.keys(refTrans?.options ?? {}).length
    const parts = [label]
    if (optCount > 0) parts.push(`${optCount} option strings`)
    return { ref: rawValue, refFieldId, resolved: parts.join(' · ') }
  }

  if (keyName === 'iconsCrossReference') {
    const refField = fields[refFieldId]
    const iconCount = Object.keys(refField?.icons ?? {}).length
    const resolved =
      iconCount > 0
        ? `${iconCount} option icon${iconCount === 1 ? '' : 's'}`
        : `icons from ${refFieldId}`
    return { ref: rawValue, refFieldId, resolved }
  }

  return null
}
