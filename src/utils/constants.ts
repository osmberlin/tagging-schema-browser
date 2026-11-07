export const GITHUB_REPO_URL = 'https://github.com/osmberlin/tagging-schema-browser'

export const RELEASE_DATA_URL =
  'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist'

/**
 * Latest pre-release dist built from id-tagging-schema `main`.
 * Upstream's "Interim Build" workflow force-pushes it to the `interim` branch on every push to
 * `main`. It used to be served via GitHub Pages (`openstreetmap.github.io/id-tagging-schema`),
 * which upstream turned off in Oct 2026; raw GitHub serves the same files with CORS and a
 * 5-minute cache.
 */
export const INTERIM_DATA_URL =
  'https://raw.githubusercontent.com/openstreetmap/id-tagging-schema/interim/dist/'

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

/** Prefix an in-app path (`/audits/x?y=1`) with the deploy base path (e.g. GitHub Pages sub-path). */
export function appPath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
