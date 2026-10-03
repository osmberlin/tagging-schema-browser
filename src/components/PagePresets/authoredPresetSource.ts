import {
  presetIdFromRef,
  resolvePresetFieldList,
} from '@/components/PagePresets/presetFieldInheritance'
import { INTERIM_DATA_URL } from '@/utils/constants'
import { schemaRepoPath } from '@/utils/githubFileUrl'
import { isPrPreviewDataUrl, prNumberFromDataUrl } from '@/utils/prPreviewUrl'
import type { RawFields, RawPreset, RawPresets } from '@/utils/types'

const RAW_REPO_URL = 'https://raw.githubusercontent.com/openstreetmap/id-tagging-schema'
const FETCH_TIMEOUT_MS = 4000
const BUILD_INHERITABLE_TYPES = new Set(['multiCombo', 'semiCombo', 'manyCombo', 'check'])
const FIELD_LIST_KEYS = ['fields', 'moreFields'] as const

export type FieldListKey = (typeof FIELD_LIST_KEYS)[number]

/** `fields` / `moreFields` as written in `data/presets/<id>.json` (with `{preset}` refs). */
export type AuthoredFieldLists = Partial<Record<FieldListKey, string[]>>

/** Why the schema build did not copy a referenced field onto the referencing preset. */
export type FieldOmission =
  | { kind: 'presetTag'; hostPresetId: string; tagKey: string; tagValue: string }
  | {
      kind: 'sameKey'
      hostPresetId: string
      fieldListKey: FieldListKey
      blockingFieldId: string
      tagKey: string
    }

/** One field a `{preset}` reference offers, and whether the build kept it. */
export type ReferencedField = { fieldId: string; omission?: FieldOmission }

export type AuthoredListEntry =
  | { kind: 'field'; fieldId: string }
  | { kind: 'presetRef'; presetRef: string; presetId: string; fields: ReferencedField[] }

/** Authored field lists of one preset, each `{preset}` reference with what it expands to. */
export type AuthoredPresetSource = Partial<Record<FieldListKey, AuthoredListEntry[]>>

export function formatFieldOmission(fieldId: string, omission: FieldOmission): string {
  if (omission.kind === 'presetTag') {
    return `${omission.hostPresetId} tag fixes ${omission.tagKey}=${omission.tagValue}`
  }
  const where = `${omission.hostPresetId} (${omission.fieldListKey}`
  if (omission.blockingFieldId === fieldId) return `${fieldId} already on ${where})`
  return `${fieldId} blocked by ${omission.blockingFieldId} on ${where}, same tag key \`${omission.tagKey}\`)`
}

function ensureSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/**
 * Where the authored `data/presets/<id>.json` for the loaded dist may live, best guess first.
 * - Unreleased (GitHub Pages) publishes only `dist`, built from `main` → raw GitHub `main`.
 * - PR preview is built from the PR merge ref; `head` is the fallback.
 * - Everything else (npm release on jsDelivr, a local checkout) ships `data/` next to `dist/`.
 * The result is only a candidate: `buildAuthoredPresetSource` decides whether it is used.
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

function usesPresetRefs(list: string[] | undefined): boolean {
  return Array.isArray(list) && list.some((item) => presetIdFromRef(item) !== null)
}

function sameList(left: string[] | undefined, right: string[] | undefined): boolean {
  if (!left || !right) return left === right
  return left.length === right.length && left.every((item, index) => item === right[index])
}

/**
 * Expand authored lists the way the id-tagging-schema build does
 * (`dereferenceUntranslatedContent` in `scripts/lib/references.ts`) and record, per `{preset}`
 * reference, which fields it contributed and which the build dropped.
 *
 * Returns null unless the expansion equals the lists of the loaded dist preset. That check is
 * what rules out a source file from another commit than the dist was built from.
 */
export function buildAuthoredPresetSource(
  presetId: string,
  authored: AuthoredFieldLists,
  rawPresets: RawPresets,
  allFields: RawFields,
): AuthoredPresetSource | null {
  const distPreset = rawPresets[presetId]
  if (!distPreset) return null

  const tags = distPreset.tags ?? {}
  const working: AuthoredFieldLists = {}
  for (const key of FIELD_LIST_KEYS) {
    if (authored[key]) working[key] = [...authored[key]]
  }

  const omissionFor = (fieldId: string): FieldOmission | undefined => {
    const field = allFields[fieldId]
    const tagKey = field?.key
    if (!tagKey) return undefined
    if (tags[tagKey] && !BUILD_INHERITABLE_TYPES.has(field.type ?? '')) {
      return { kind: 'presetTag', hostPresetId: presetId, tagKey, tagValue: tags[tagKey] }
    }
    for (const fieldListKey of FIELD_LIST_KEYS) {
      const blockingFieldId = working[fieldListKey]?.find((id) => allFields[id]?.key === tagKey)
      if (blockingFieldId) {
        return { kind: 'sameKey', hostPresetId: presetId, fieldListKey, blockingFieldId, tagKey }
      }
    }
    return undefined
  }

  const source: AuthoredPresetSource = {}
  for (const key of FIELD_LIST_KEYS) {
    const list = working[key]
    if (!list) continue
    const entries: AuthoredListEntry[] = []
    let index = 0
    for (const item of authored[key] ?? []) {
      const refId = presetIdFromRef(item)
      if (!refId) {
        entries.push({ kind: 'field', fieldId: item })
        index++
        continue
      }
      const referenced = rawPresets[refId]
      if (!referenced) return null
      const fields = referencedFieldIds(refId, referenced, key, rawPresets, allFields).map(
        (fieldId) => ({ fieldId, omission: omissionFor(fieldId) }),
      )
      const kept = fields.filter((field) => !field.omission).map((field) => field.fieldId)
      list.splice(index, 1, ...kept)
      index += kept.length
      entries.push({ kind: 'presetRef', presetRef: item, presetId: refId, fields })
    }
    source[key] = entries
  }

  const matchesDist = FIELD_LIST_KEYS.every((key) => {
    const distList = distPreset[key]
    if (usesPresetRefs(distList)) return sameList(authored[key], distList)
    return sameList(working[key], Array.isArray(distList) ? distList : undefined)
  })
  return matchesDist ? source : null
}

/** Fields a referenced preset offers. v7 dist lists are already expanded by the build. */
function referencedFieldIds(
  presetId: string,
  preset: RawPreset,
  key: FieldListKey,
  rawPresets: RawPresets,
  allFields: RawFields,
): string[] {
  const list = preset[key]
  if (!Array.isArray(list)) return []
  if (!usesPresetRefs(list)) return list
  return resolvePresetFieldList(presetId, preset, key, rawPresets, allFields)
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
type LoadOutcome = { source: AuthoredPresetSource | null; unavailable: boolean }

const cache = new Map<string, Promise<AuthoredPresetSource | null>>()

function cacheKey(dataUrl: string, presetId: string): string {
  return `${ensureSlash(dataUrl.trim())}\0${presetId}`
}

async function fetchValidated(params: LoadParams): Promise<LoadOutcome> {
  const { dataUrl, presetId, rawPresets, allFields } = params
  const distPreset = rawPresets[presetId]
  if (!distPreset) return { source: null, unavailable: false }

  // A dist that still carries `{preset}` refs (not expanded by the build) is its own source.
  if (FIELD_LIST_KEYS.some((key) => usesPresetRefs(distPreset[key]))) {
    const source = buildAuthoredPresetSource(presetId, distPreset, rawPresets, allFields)
    return { source, unavailable: false }
  }

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
    const source = authored && buildAuthoredPresetSource(presetId, authored, rawPresets, allFields)
    if (source) return { source, unavailable: false }
  }

  return { source: null, unavailable }
}

/**
 * Authored field lists for one preset of the loaded dist, or null when no source file could be
 * fetched and verified (the source tree then shows the expanded dist lists).
 * Cached per (dataUrl, presetId).
 */
export function loadAuthoredPresetSource(params: LoadParams): Promise<AuthoredPresetSource | null> {
  const key = cacheKey(params.dataUrl, params.presetId)
  const cached = cache.get(key)
  if (cached) return cached

  const pending = fetchValidated(params).then(
    ({ source, unavailable }) => {
      if (unavailable) cache.delete(key)
      return source
    },
    () => {
      cache.delete(key)
      return null
    },
  )
  cache.set(key, pending)
  return pending
}

export function clearAuthoredPresetSourceCache(): void {
  cache.clear()
}
