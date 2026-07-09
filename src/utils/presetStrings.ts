/** v6: comma-separated string; v7: string[]. */
export function normalizeTerms(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((term) => term.toLowerCase().trim()).filter(Boolean)
  }
  return value
    .toLowerCase()
    .trim()
    .split(/\s*,+\s*/)
    .filter(Boolean)
}

/** v6: newline-separated string; v7: string[]. */
export function normalizeAliases(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((alias) => alias.trim()).filter(Boolean)
  return value.trim() ? value.split(/\s*[\r\n]+\s*/).filter(Boolean) : []
}

/** Display field/preset terms from either schema format. */
export function formatTermsDisplay(value: string | string[] | undefined): string {
  if (!value) return '—'
  if (Array.isArray(value)) return value.join('\n')
  return value
}

/** Flatten terms for translate/copy helpers. */
export function termsToLines(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return value.trim() ? [value] : []
}
