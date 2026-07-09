import { ensureIconsForPresetUsage } from '@/components/PageIcons/iconRegistry'
import { type RawSchemaPayload, loadSchemaData } from '@/components/PagePresets/dataLoader'
import { denormalize } from '@/components/PagePresets/denormalize'
import {
  detectSchemaBuildInfo,
  isSchemaBuildAllowed,
  unsupportedSchemaBuildMessage,
} from '@/utils/schemaBuildVersion'
import type { SchemaData } from '@/utils/types'

function normalizeDataUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

function schemaCacheKey(dataUrl: string, allowLegacy: boolean): string {
  const base = normalizeDataUrl(dataUrl)
  return allowLegacy ? `${base}?legacy=1` : base
}

const cache = new Map<string, SchemaData>()
const inflight = new Map<string, Promise<SchemaData | null>>()
const loadErrors = new Map<string, string>()

export function getSchemaLoadError(dataUrl: string, allowLegacy = false): string | null {
  return loadErrors.get(schemaCacheKey(dataUrl, allowLegacy)) ?? null
}

function clearSchemaLoadError(dataUrl: string, allowLegacy: boolean): void {
  loadErrors.delete(schemaCacheKey(dataUrl, allowLegacy))
}

export function processRawSchemaPayload(
  raw: RawSchemaPayload,
  options: { dataUrl: string; allowLegacy: boolean },
): SchemaData | null {
  if (raw.loadErrors.length > 0) return null

  const schemaBuild = detectSchemaBuildInfo(options.dataUrl, raw)
  if (!isSchemaBuildAllowed(schemaBuild, options)) {
    return null
  }

  const diagnostics: string[] = []
  const presets = denormalize(raw.presets, raw.translations, raw.categories, raw.fields)
  const presetsById = new Map(presets.map((p) => [p.id, p]))
  const categoryNames: Record<string, string> = {}
  for (const [cid] of Object.entries(raw.categories)) {
    categoryNames[cid] = raw.translations.en?.presets?.categories?.[cid]?.name ?? cid
  }

  return {
    presets,
    presetsById,
    rawPresets: raw.presets,
    categories: raw.categories,
    categoryNames,
    fields: raw.fields,
    translations: raw.translations,
    fieldTranslations: raw.translations.en?.presets?.fields ?? {},
    schemaReferences: raw.references,
    schemaBuild,
    loadError: null,
    diagnostics,
  }
}

export function getCachedSchemaData(dataUrl: string, allowLegacy = false): SchemaData | null {
  return cache.get(schemaCacheKey(dataUrl, allowLegacy)) ?? null
}

function storeSchemaData(dataUrl: string, allowLegacy: boolean, data: SchemaData): void {
  cache.set(schemaCacheKey(dataUrl, allowLegacy), data)
}

/** Fetch and denormalize schema JSON; dedupes concurrent requests and caches the result. */
export async function preloadSchemaData(
  dataUrl: string,
  options: { allowLegacy?: boolean } = {},
): Promise<SchemaData | null> {
  const allowLegacy = options.allowLegacy ?? false
  const key = schemaCacheKey(dataUrl, allowLegacy)
  const cached = cache.get(key)
  if (cached) return cached

  const existing = inflight.get(key)
  if (existing) return existing

  const promise = loadSchemaData(dataUrl)
    .then((raw) => {
      if (raw.loadErrors.length > 0) {
        const message = raw.loadErrors.join('; ')
        loadErrors.set(key, message)
        inflight.delete(key)
        return null
      }

      const schemaBuild = detectSchemaBuildInfo(dataUrl, raw)
      if (!isSchemaBuildAllowed(schemaBuild, { allowLegacy, dataUrl })) {
        const message = unsupportedSchemaBuildMessage(schemaBuild)
        loadErrors.set(key, message)
        inflight.delete(key)
        return null
      }

      clearSchemaLoadError(dataUrl, allowLegacy)
      const data = processRawSchemaPayload(raw, { dataUrl, allowLegacy })
      if (data) {
        storeSchemaData(dataUrl, allowLegacy, data)
        void ensureIconsForPresetUsage(data.rawPresets)
      }
      inflight.delete(key)
      return data
    })
    .catch((e) => {
      const message = e instanceof Error ? e.message : String(e)
      loadErrors.set(key, message)
      inflight.delete(key)
      return null
    })

  inflight.set(key, promise)
  return promise
}
