const OSM_WIKI_BASE = 'https://wiki.openstreetmap.org/wiki'

/** Link to an OSM Wiki key page, e.g. `Key:name`. */
export function osmWikiKeyUrl(key: string): string {
  return `${OSM_WIKI_BASE}/Key:${key}`
}

/** Link to an OSM Wiki tag page, e.g. `Tag:shop%3Dinterior_decoration`. */
export function osmWikiTagUrl(key: string, value: string): string {
  return `${OSM_WIKI_BASE}/Tag:${encodeURIComponent(`${key}=${value}`)}`
}

/** Prefer a tag page when both key and value are known; otherwise link the key page. */
export function osmWikiUrlForTag(key: string, value?: string): string {
  if (value !== undefined && value !== '') return osmWikiTagUrl(key, value)
  return osmWikiKeyUrl(key)
}
