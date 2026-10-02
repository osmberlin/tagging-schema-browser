import { presetIdFromRef } from '@/components/PagePresets/presetFieldInheritance'
import { INTERIM_DATA_URL } from '@/utils/constants'
import { schemaRepoPath } from '@/utils/githubFileUrl'
import { isPrPreviewDataUrl, prNumberFromDataUrl } from '@/utils/prPreviewUrl'
import type { RawFields, RawPreset, RawPresets } from '@/utils/types'

const RAW_REPO_URL = 'https://raw.githubusercontent.com/openstreetmap/id-tagging-schema'
const FETCH_TIMEOUT_MS = 4000
const BUILD_INHERITABLE_TYPES = new Set(['multiCombo', 'semiCombo', 'manyCombo', 'check'])
const FIELD_LIST_KEYS = ['fields', 'moreFields'] as const

/** `fields` / `moreFields` as written in `data/presets/<id>.json` (with `{preset}` refs). */
export type AuthoredFieldLists = { fields?: string[]; moreFields?: string[] }

function ensureSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/**
 * Where the authored `data/presets/<id>.json` for the loaded dist may live, best guess first.
 * - Unreleased (GitHub Pages) publishes only `dist`, built from `main` → raw GitHub `main`.
 * - PR preview is built from the PR merge ref; `head` is the fallback.
 * - Everything else (npm release on jsDelivr, a local checkout) ships `data/` next to `dist/`.
 * The result is only a candidate: `validateAuthoredFieldLists` decides whether it is used.
 */
export function authoredPresetSourceUrls(
  dataUrl: string,
  presetId: string,
  options?: { searchable?: boolean },
): string[] {
  const base = ensureSlash(dataUrl.trim())
  const repoPaths = [
    schemaRepoPath('preset', presetId, options),
    schemaRepoPath('preset', presetId, { searchable: options?.searchable === false }),
  ].filter((path, index, all) => all.indexOf(path) === index)

  let roots: string[]
  if (base === ensureSlash(INTERIM_DATA_URL)) {
    roots = [`${RAW_REPO_URL}/main/`]
  } else if (isPrPreviewDataUrl(base)) {
    const prNumber = prNumberFromDataUrl(base)
    if (prNumber === null) return []
    roots = [
      `${RAW_REPO_URL}/refs/pull/${prNumber}/merge/`,
      `${RAW_REPO_URL}/refs/pull/${prNumber}/head/`,
    ]
  } else {
    try {
      roots = [new URL('..', new URL(base, globalThis.location?.href)).href]
    } catch {
      return []
    }
  }

  return roots.flatMap((root) => repoPaths.map((repoPath) => `${root}${repoPath}`))
}

function parseAuthoredFieldLists(json: unknown): AuthoredFieldLists | null {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return null
  const lists: AuthoredFieldLists = {}
  for (const key of FIELD_LIST_KEYS) {
    const list = (json as Record<string, unknown>)[key]
    if (list === undefined) continue
    if (!Array.isArray(list) || !list.every((item) => typeof item === 'string')) return null
    lists[key] = list
  }
  return lists
}

/**
 * Expand authored lists the way the id-tagging-schema build does
 * (`dereferenceUntranslatedContent` in `scripts/lib/references.ts`), using the already
 * expanded dist lists of the referenced presets.
 */
export function expandAuthoredFieldLists(
  distPreset: RawPreset,
  authored: AuthoredFieldLists,
  rawPresets: RawPresets,
  allFields: RawFields,
): AuthoredFieldLists | null {
  const working: AuthoredFieldLists = {
    ...(authored.fields ? { fields: [...authored.fields] } : {}),
    ...(authored.moreFields ? { moreFields: [...authored.moreFields] } : {}),
  }
  const tags = distPreset.tags ?? {}

  const shouldInherit = (fieldId: string): boolean => {
    const field = allFields[fieldId]
    if (!field?.key) return true
    if (tags[field.key] && !BUILD_INHERITABLE_TYPES.has(field.type ?? '')) return false
    return !FIELD_LIST_KEYS.some((key) =>
      working[key]?.some((originalField) => allFields[originalField]?.key === field.key),
    )
  }

  for (const key of FIELD_LIST_KEYS) {
    const list = working[key]
    if (!list) continue
    for (let i = 0; i < list.length; i++) {
      const refId = presetIdFromRef(list[i]!)
      if (!refId) continue
      const referenced = rawPresets[refId]
      if (!referenced) return null
      const referencedList = referenced[key]
      list.splice(
        i--,
        1,
        ...(Array.isArray(referencedList) ? referencedList : []).filter(shouldInherit),
      )
    }
  }

  return working
}

function sameList(left: string[] | undefined, right: string[] | undefined): boolean {
  if (!left || !right) return left === right
  return left.length === right.length && left.every((item, index) => item === right[index])
}

/**
 * True when the authored lists expand to exactly the lists of the loaded dist preset.
 * This is what rules out a source file from another commit than the dist was built from.
 */
export function validateAuthoredFieldLists(
  distPreset: RawPreset,
  authored: AuthoredFieldLists,
  rawPresets: RawPresets,
  allFields: RawFields,
): boolean {
  const expanded = expandAuthoredFieldLists(distPreset, authored, rawPresets, allFields)
  if (!expanded) return false
  return FIELD_LIST_KEYS.every((key) =>
    sameList(expanded[key], Array.isArray(distPreset[key]) ? distPreset[key] : undefined),
  )
}

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>

type LoadParams = {
  dataUrl: string
  presetId: string
  rawPresets: RawPresets
  allFields: RawFields
  fetchImpl?: FetchLike
  timeoutMs?: number
}

/** `unavailable` (network error / timeout) is not cached, so a later visit retries. */
type LoadOutcome = { lists: AuthoredFieldLists | null; unavailable: boolean }

const cache = new Map<string, Promise<AuthoredFieldLists | null>>()

function cacheKey(dataUrl: string, presetId: string): string {
  return `${ensureSlash(dataUrl.trim())}\0${presetId}`
}

async function fetchValidated(params: LoadParams): Promise<LoadOutcome> {
  const { dataUrl, presetId, rawPresets, allFields } = params
  const distPreset = rawPresets[presetId]
  if (!distPreset) return { lists: null, unavailable: false }

  const fetchImpl = params.fetchImpl ?? fetch
  const urls = authoredPresetSourceUrls(dataUrl, presetId, {
    searchable: distPreset.searchable !== false,
  })
  let unavailable = false

  for (const url of urls) {
    let json: unknown
    try {
      const response = await fetchImpl(url, {
        signal: AbortSignal.timeout(params.timeoutMs ?? FETCH_TIMEOUT_MS),
      })
      if (!response.ok) continue
      json = await response.json()
    } catch (error) {
      if (!(error instanceof SyntaxError)) unavailable = true
      continue
    }
    const authored = parseAuthoredFieldLists(json)
    if (authored && validateAuthoredFieldLists(distPreset, authored, rawPresets, allFields)) {
      return { lists: authored, unavailable: false }
    }
  }

  return { lists: null, unavailable }
}

/**
 * Authored `fields` / `moreFields` for one preset of the loaded dist, or null when no source
 * file could be fetched and verified (callers then fall back to the reconstruction heuristic).
 * Cached per (dataUrl, presetId).
 */
export function loadAuthoredFieldLists(params: LoadParams): Promise<AuthoredFieldLists | null> {
  const key = cacheKey(params.dataUrl, params.presetId)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = fetchValidated(params).then(
    ({ lists, unavailable }) => {
      if (unavailable) cache.delete(key)
      return lists
    },
    () => {
      cache.delete(key)
      return null
    },
  )
  cache.set(key, pending)
  return pending
}

export function clearAuthoredFieldListsCache(): void {
  cache.clear()
}
