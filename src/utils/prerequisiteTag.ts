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

function valuesFromPrerequisite(prereq: PrerequisiteTag): string[] | undefined {
  if (prereq.values) return prereq.values
  if (prereq.value !== undefined) return [prereq.value]
  return undefined
}

function valuesNotFromPrerequisite(prereq: PrerequisiteTag): string[] | undefined {
  if (prereq.valuesNot) return prereq.valuesNot
  if (prereq.valueNot !== undefined) return [prereq.valueNot]
  return undefined
}

/**
 * Whether a field's prerequisiteTag is satisfied.
 * Mirrors iD: if the field's own key already has a value, prerequisites are ignored.
 */
export function matchesPrerequisiteTag(
  prereq: PrerequisiteTag | undefined,
  tags: Record<string, string>,
  fieldKey?: string,
): boolean {
  if (!prereq) return true

  if (fieldKey && Object.hasOwn(tags, fieldKey) && tags[fieldKey] !== '') {
    return true
  }

  if (prereq.keyNot) {
    return !Object.hasOwn(tags, prereq.keyNot)
  }

  const key = prereq.key
  if (!key) return true

  const values = valuesFromPrerequisite(prereq)
  const valuesNot = valuesNotFromPrerequisite(prereq)

  if (values) {
    return Object.hasOwn(tags, key) && values.includes(tags[key])
  }

  if (valuesNot) {
    return !Object.hasOwn(tags, key) || !valuesNot.includes(tags[key])
  }

  return Object.hasOwn(tags, key)
}

/** Compact summary for preset-match conditional field hints. */
export function describePrerequisiteTag(prereq: PrerequisiteTag): string {
  if (prereq.keyNot) {
    return `key ${prereq.keyNot} must be absent`
  }

  if (!prereq.key) return 'other tag conditions'

  const values = valuesFromPrerequisite(prereq)
  const valuesNot = valuesNotFromPrerequisite(prereq)

  if (values) {
    return `${prereq.key}=${values.join('|')}`
  }
  if (valuesNot) {
    return `${prereq.key}≠${valuesNot.join('|')}`
  }
  return `${prereq.key} present`
}
