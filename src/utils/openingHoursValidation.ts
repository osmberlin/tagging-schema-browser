import type { opening_hours_warning } from 'opening_hours'

export type { opening_hours_warning }

export type OpeningHoursValidationOptions = {
  locale?: string
  tagKey?: string
}

export type OpeningHoursValidationResult = {
  valid: boolean
  error: string | null
  warnings: opening_hours_warning[]
}

/** Parse an opening-hours value and return structured warnings from opening_hours.js 3.14+. */
export async function validateOpeningHours(
  value: string,
  options: OpeningHoursValidationOptions = {},
): Promise<OpeningHoursValidationResult> {
  const trimmed = value.trim()
  if (!trimmed) {
    return { valid: true, error: null, warnings: [] }
  }

  const { default: OpeningHours } = await import('opening_hours')

  try {
    const oh = new OpeningHours(trimmed, undefined, {
      mode: undefined,
      map_value: undefined,
      locale: options.locale,
      tag_key: options.tagKey ?? 'opening_hours',
      warnings_severity: 4,
    })
    void oh.getState()
    return { valid: true, error: null, warnings: oh.getStructuredWarnings() }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
      warnings: [],
    }
  }
}

/** Split a warning value at the library-reported position for inline highlighting. */
export function splitWarningValue(warning: opening_hours_warning): {
  before: string
  marker: string
  after: string
} | null {
  if (warning.position === null) return null
  const position = Math.min(Math.max(warning.position, 0), warning.value.length)
  return {
    before: warning.value.slice(0, position),
    marker: warning.value[position] ?? '',
    after: warning.value.slice(position + (warning.value[position] ? 1 : 0)),
  }
}
