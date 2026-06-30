export const RELEASE_DATA_URL =
  'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist'

/** Latest pre-release dist built from id-tagging-schema `main` (iD staging deploy). */
export const INTEREM_DATA_URL = 'https://ideditor.netlify.app/id-tagging-schema/dist/'

const RELEASE_SCHEMA_PROXY_PATH = 'release-schema'

/** Same-origin fixture shipped in `public/test-schema/` (Playwright e2e only). */
export function bundledTestSchemaUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}test-schema`
}

/**
 * Same-origin proxy to the jsDelivr release (Netlify redirect + Vite dev proxy).
 * Avoids cross-origin CDN fetches while still loading the full schema + translations.
 */
export function proxiedReleaseSchemaUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${RELEASE_SCHEMA_PROXY_PATH}`
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

export function isBundledTestSchemaUrl(url: string): boolean {
  return ensureTrailingSlash(url) === ensureTrailingSlash(bundledTestSchemaUrl())
}

export function isProxiedReleaseSchemaUrl(url: string): boolean {
  return ensureTrailingSlash(url) === ensureTrailingSlash(proxiedReleaseSchemaUrl())
}

function isPreviewHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.netlify.app')
}

/** Release dist base for the current environment (proxied on previews, CDN elsewhere). */
export function effectiveReleaseDataUrl(): string {
  return isPreviewHost() ? proxiedReleaseSchemaUrl() : RELEASE_DATA_URL
}
