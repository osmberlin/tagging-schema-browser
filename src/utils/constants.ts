export const GITHUB_REPO_URL = 'https://github.com/osmberlin/tagging-schema-browser'

/** GitHub web editor for deliberate missing-inheritance overrides (post-merge on main). */
export const MISSING_INHERITANCE_OVERRIDES_EDIT_URL = `${GITHUB_REPO_URL}/edit/main/src/data/missing-inheritance-overrides.yaml`

/** GitHub web editor for deliberate risky typeCombo overrides (post-merge on main). */
export const RISKY_TYPECOMBO_OVERRIDES_EDIT_URL = `${GITHUB_REPO_URL}/edit/main/src/data/risky-typecombo-overrides.yaml`

export const RELEASE_DATA_URL =
  'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist'

/** Latest pre-release dist built from id-tagging-schema `main` (GitHub Pages). */
export const INTERIM_DATA_URL = 'https://openstreetmap.github.io/id-tagging-schema/dist/'

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
