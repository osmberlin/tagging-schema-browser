/** Parse `key=value` lines (one per line) into an OSM tag object. */
export function parseOsmTags(input: string): Record<string, string> {
  const tags: Record<string, string> = {}
  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (key) tags[key] = value
  }
  return tags
}

/** Serialize tags back to `key=value` lines (sorted keys). */
export function serializeOsmTags(tags: Record<string, string>): string {
  return Object.keys(tags)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${tags[key]}`)
    .join('\n')
}
