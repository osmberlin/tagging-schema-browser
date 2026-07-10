/** Known id-tagging-schema field types in a sensible browse order. */
const FIELD_TYPE_ORDER = [
  'text',
  'textarea',
  'number',
  'integer',
  'schedule',
  'localized',
  'tel',
  'email',
  'url',
  'identifier',
  'colour',
  'date',
  'combo',
  'typeCombo',
  'multiCombo',
  'manyCombo',
  'networkCombo',
  'semiCombo',
  'directionalCombo',
  'check',
  'defaultCheck',
  'onewayCheck',
  'radio',
  'structureRadio',
  'access',
  'address',
  'roadspeed',
  'roadheight',
  'restrictions',
  'wikidata',
  'wikipedia',
] as const

const FIELD_TYPE_HINTS: Partial<Record<string, string>> = {
  integer: 'Whole numbers only',
  number: 'Numeric values',
  schedule: 'Opening-hours syntax',
}

export function fieldTypeHint(type: string): string | undefined {
  return FIELD_TYPE_HINTS[type]
}

export function sortFieldTypes(types: Iterable<string>): string[] {
  const unique = [...new Set(types)]
  const orderIndex = new Map<string, number>(FIELD_TYPE_ORDER.map((type, index) => [type, index]))

  return unique.sort((a, b) => {
    const ai = orderIndex.get(a)
    const bi = orderIndex.get(b)
    if (ai !== undefined && bi !== undefined) return ai - bi
    if (ai !== undefined) return -1
    if (bi !== undefined) return 1
    return a.localeCompare(b)
  })
}
