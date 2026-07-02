export const RELEASE_DATA_URL =
  'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist'

/** Latest pre-release dist built from id-tagging-schema `main` (iD staging deploy). */
export const INTEREM_DATA_URL = 'https://ideditor.netlify.app/id-tagging-schema/dist/'

/** Same-origin fixture in `public/test-schema/` (Playwright e2e via `?dataUrl=/test-schema`). */
export function bundledTestSchemaUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}test-schema`
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

export function isBundledTestSchemaUrl(url: string): boolean {
  return ensureTrailingSlash(url) === ensureTrailingSlash(bundledTestSchemaUrl())
}
