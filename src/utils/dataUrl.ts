import { INTERIM_DATA_URL, RELEASE_DATA_URL } from '@/utils/constants'

export type SchemaReference = 'release' | 'interim'

function ensureSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

const JSDELIVR_RELEASE_RE = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@openstreetmap\/id-tagging-schema@/

/** True when the active dist is a published npm release (full translation set). */
export function isReleaseDataUrl(dataUrl: string): boolean {
  const normalized = ensureSlash(dataUrl.trim())
  if (normalized === ensureSlash(RELEASE_DATA_URL)) return true
  return JSDELIVR_RELEASE_RE.test(normalized)
}

/** True when the URL is a built-in release or interim dataset (not a custom PR preview). */
export function isCanonicalDataUrl(url: string): boolean {
  const normalized = ensureSlash(url)
  return (
    normalized === ensureSlash(RELEASE_DATA_URL) || normalized === ensureSlash(INTERIM_DATA_URL)
  )
}

export function dataUrlForReference(reference: SchemaReference): string {
  return reference === 'interim' ? INTERIM_DATA_URL : RELEASE_DATA_URL
}

/** URL `reference=release` wins; otherwise use persisted preference (default interim). */
export function resolveSchemaReference(
  urlReference: SchemaReference | undefined,
  persistedReference: SchemaReference,
): SchemaReference {
  if (urlReference === 'release') return 'release'
  if (urlReference === 'interim') return 'interim'
  return persistedReference
}

/** Param value when switching reference via the header toggle (interim omits the param). */
export function referenceSearchParam(reference: SchemaReference): SchemaReference | undefined {
  return reference === 'release' ? 'release' : undefined
}

/**
 * `reference=release` with a non-release `dataUrl`: browse the published release and compare
 * against that baseline (unreleased main or a PR preview URL).
 */
export function isReleaseCompareMode(dataUrl: string, reference: SchemaReference): boolean {
  const trimmed = dataUrl.trim()
  if (!trimmed || reference !== 'release') return false
  return ensureSlash(trimmed) !== ensureSlash(RELEASE_DATA_URL)
}

/** Pick the active dist base. Custom `dataUrl` wins, except in release-compare mode. */
export function resolveActiveDataUrl(dataUrl: string, reference: SchemaReference): string {
  const trimmed = dataUrl.trim()
  if (isReleaseCompareMode(trimmed, reference)) {
    return RELEASE_DATA_URL
  }
  if (trimmed) return trimmed
  return dataUrlForReference(reference)
}

/** Baseline dist URL when comparing (null when not comparing). */
export function resolveCompareBaselineUrl(
  dataUrl: string,
  reference: SchemaReference,
): string | null {
  const trimmed = dataUrl.trim()
  if (!trimmed) return null
  if (isReleaseCompareMode(trimmed, reference)) return ensureSlash(trimmed)
  if (!isCanonicalDataUrl(trimmed)) return INTERIM_DATA_URL
  return null
}

/** Short UI label for the comparison baseline. */
export function compareBaselineLabel(baselineUrl: string): string {
  if (ensureSlash(baselineUrl) === ensureSlash(INTERIM_DATA_URL)) return 'unreleased'
  try {
    return new URL(baselineUrl).hostname
  } catch {
    return baselineUrl
  }
}
