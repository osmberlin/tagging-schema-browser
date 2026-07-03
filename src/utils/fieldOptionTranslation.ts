export type FieldOptionTranslation =
  | string
  | {
      title?: string
      description?: string
    }

export function isFieldOptionObject(
  value: FieldOptionTranslation | undefined,
): value is { title?: string; description?: string } {
  return typeof value === 'object' && value !== null
}

function nonEmptyString(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function fieldOptionTitle(value: FieldOptionTranslation | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return nonEmptyString(value)
  return nonEmptyString(value.title)
}

export function fieldOptionDescription(
  value: FieldOptionTranslation | undefined,
): string | undefined {
  if (!isFieldOptionObject(value)) return undefined
  return nonEmptyString(value.description)
}

export function hasFieldOptionTranslation(value: FieldOptionTranslation | undefined): boolean {
  return Boolean(fieldOptionTitle(value) || fieldOptionDescription(value))
}

export function fieldOptionTranslateTexts(value: FieldOptionTranslation | undefined): string[] {
  return [fieldOptionTitle(value), fieldOptionDescription(value)].filter((text): text is string =>
    Boolean(text),
  )
}
