export type PrerequisiteTag = {
  key?: string
  keyNot?: string
  value?: string
  valueNot?: string
  values?: string[]
  valuesNot?: string[]
}

export function parsePrerequisiteTag(value: unknown): PrerequisiteTag | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as PrerequisiteTag
}

/** Plain-language summary for field detail and source JSON. */
export function formatPrerequisiteTag(tag: PrerequisiteTag): string {
  if (tag.keyNot) {
    return `Shown only when tag ${tag.keyNot} is not present`
  }

  if (!tag.key) return 'Visibility depends on other tags'

  const key = tag.key

  if (tag.values?.length) {
    const quoted = tag.values.map((value) => `"${value}"`).join(' or ')
    return `Shown only when ${key} is ${quoted}`
  }

  if (tag.value) {
    return `Shown only when ${key}=${tag.value}`
  }

  if (tag.valuesNot?.length) {
    const quoted = tag.valuesNot.map((value) => `"${value}"`).join(' and not ')
    return `Shown only when ${key} is not ${quoted}`
  }

  if (tag.valueNot) {
    return `Shown only when ${key}≠${tag.valueNot}`
  }

  return `Shown only when ${key} is set`
}
