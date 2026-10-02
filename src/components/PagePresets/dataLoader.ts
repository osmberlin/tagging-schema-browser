import { fetchSchemaJson } from '@/utils/schemaFetch'
import type { RawCategories, RawFields, RawPresets, RawTranslations } from '@/utils/types'

/** JSON files required to denormalize and browse a schema dist. */
export const SCHEMA_CORE_FILES = [
  'presets.min.json',
  'translations/en.min.json',
  'preset_categories.min.json',
  'fields.min.json',
] as const

const OPTIONAL_FILES = ['discarded.min.json', 'discarded.json'] as const

export type RawSchemaPayload = {
  presets: RawPresets
  translations: RawTranslations
  categories: RawCategories
  fields: RawFields
  discarded: Record<string, boolean>
  loadErrors: string[]
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

async function fetchJson<T>(baseUrl: string, path: string): Promise<T> {
  return fetchSchemaJson<T>(`${baseUrl}${path}`)
}

export async function loadSchemaData(dataUrl: string): Promise<RawSchemaPayload> {
  const base = ensureTrailingSlash(dataUrl)
  const loadErrors: string[] = []
  let presets: RawPresets = {}
  let translations: RawTranslations = {}
  let categories: RawCategories = {}
  let fields: RawFields = {}
  let discarded: Record<string, boolean> = {}

  const results = await Promise.all(
    [...SCHEMA_CORE_FILES, ...OPTIONAL_FILES].map(async (file) => {
      try {
        const data = await fetchJson<unknown>(base, file)
        return { file, data } as const
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return { file, error: msg } as const
      }
    }),
  )

  for (const result of results) {
    if ('error' in result) {
      if (!OPTIONAL_FILES.includes(result.file as (typeof OPTIONAL_FILES)[number])) {
        loadErrors.push(`${result.file}: ${result.error}`)
      }
      continue
    }
    const { file, data } = result
    if (file === 'presets.min.json') presets = data as RawPresets
    else if (file === 'translations/en.min.json') translations = data as RawTranslations
    else if (file === 'preset_categories.min.json') categories = data as RawCategories
    else if (file === 'fields.min.json') fields = data as RawFields
    else if (file === 'discarded.min.json' || file === 'discarded.json') {
      if (Object.keys(discarded).length === 0) {
        discarded = data as Record<string, boolean>
      }
    }
  }

  return { presets, translations, categories, fields, discarded, loadErrors }
}

export function getExpectedFilesHelp(): string {
  return `Expected at dataUrl: ${SCHEMA_CORE_FILES.join(', ')}. Example: ?dataUrl=https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7/dist`
}
