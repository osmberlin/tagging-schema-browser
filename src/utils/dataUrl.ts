import {
  INTEREM_DATA_URL,
  RELEASE_DATA_URL,
  effectiveReleaseDataUrl,
  isProxiedReleaseSchemaUrl,
} from '@/utils/constants'

export type SchemaReference = 'release' | 'interem'

function ensureSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/** True when the URL is a built-in release or interem dataset (not a custom PR preview). */
export function isCanonicalDataUrl(url: string): boolean {
  const normalized = ensureSlash(url)
  return (
    normalized === ensureSlash(RELEASE_DATA_URL) ||
    normalized === ensureSlash(INTEREM_DATA_URL) ||
    isProxiedReleaseSchemaUrl(url)
  )
}

export function dataUrlForReference(reference: SchemaReference): string {
  return reference === 'interem' ? INTEREM_DATA_URL : effectiveReleaseDataUrl()
}

/** URL `reference=release` wins; otherwise use persisted preference (default interem). */
export function resolveSchemaReference(
  urlReference: SchemaReference | undefined,
  persistedReference: SchemaReference,
): SchemaReference {
  if (urlReference === 'release') return 'release'
  if (urlReference === 'interem') return 'interem'
  return persistedReference
}

/** Param value when switching reference via the header toggle (interem omits the param). */
export function referenceSearchParam(reference: SchemaReference): SchemaReference | undefined {
  return reference === 'release' ? 'release' : undefined
}

/**
 * `reference=release` with a non-release `dataUrl`: browse the published release and compare
 * against that baseline (staging main or a PR preview URL).
 */
export function isReleaseCompareMode(dataUrl: string, reference: SchemaReference): boolean {
  const trimmed = dataUrl.trim()
  if (!trimmed || reference !== 'release') return false
  const releaseBases = [RELEASE_DATA_URL, effectiveReleaseDataUrl()]
  return !releaseBases.some((base) => ensureSlash(trimmed) === ensureSlash(base))
}

/** Pick the active dist base. Custom `dataUrl` wins, except in release-compare mode. */
export function resolveActiveDataUrl(dataUrl: string, reference: SchemaReference): string {
  const trimmed = dataUrl.trim()
  if (isReleaseCompareMode(trimmed, reference)) {
    return effectiveReleaseDataUrl()
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
  if (!isCanonicalDataUrl(trimmed)) return INTEREM_DATA_URL
  return null
}

/** Short UI label for the comparison baseline. */
export function compareBaselineLabel(baselineUrl: string): string {
  if (ensureSlash(baselineUrl) === ensureSlash(INTEREM_DATA_URL)) return 'staging'
  try {
    return new URL(baselineUrl).hostname
  } catch {
    return baselineUrl
  }
}
