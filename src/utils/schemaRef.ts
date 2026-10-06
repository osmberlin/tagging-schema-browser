/** Zero-width and bidi control characters that sneak in when copying text from rendered pages. */
const INVISIBLE_CHARS = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g

/**
 * Target id of a schema `{some/id}` reference, or null when `value` is not one.
 *
 * Invisible characters inside the braces (e.g. the U+200E that id-tagging-schema had to strip from
 * `{presets/amenity/bicycle_parking/shed}`) are dropped, so a stray one doesn't turn a reference
 * into a dangling raw string.
 */
export function schemaRefTarget(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^\{([^{}]+)\}$/.exec(value.replace(INVISIBLE_CHARS, ''))
  return match ? match[1] : null
}

export function isSchemaRef(value: unknown): value is string {
  return schemaRefTarget(value) !== null
}
