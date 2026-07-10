import { ensureIconsForPresetUsage } from '@/components/PageIcons/iconRegistry'
import { type RawSchemaPayload, loadSchemaData } from '@/components/PagePresets/dataLoader'
import { denormalize } from '@/components/PagePresets/denormalize'
import { refreshPresetSearchIndex } from '@/components/PagePresets/presetSearch'
import {
  detectSchemaBuildInfo,
  isSchemaBuildSupported,
  unsupportedSchemaBuildMessage,
} from '@/utils/schemaBuildVersion'
import type { SchemaData } from '@/utils/types'

function normalizeDataUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

const cache = new Map<string, SchemaData>()
const inflight = new Map<string, Promise<SchemaData | null>>()
const loadErrors = new Map<string, string>()

export function getSchemaLoadError(dataUrl: string): string | null {
  return loadErrors.get(normalizeDataUrl(dataUrl)) ?? null
}

function clearSchemaLoadError(dataUrl: string): void {
  loadErrors.delete(normalizeDataUrl(dataUrl))
}

export function processRawSchemaPayload(
  raw: RawSchemaPayload,
  options: { dataUrl: string },
): SchemaData | null {
  if (raw.loadErrors.length > 0) return null

  const schemaBuild = detectSchemaBuildInfo(options.dataUrl, raw)
  if (!isSchemaBuildSupported(schemaBuild, options.dataUrl)) {
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
    schemaBuild,
    loadError: null,
    diagnostics,
  }
}

export function getCachedSchemaData(dataUrl: string): SchemaData | null {
  return cache.get(normalizeDataUrl(dataUrl)) ?? null
}

function storeSchemaData(dataUrl: string, data: SchemaData): void {
  cache.set(normalizeDataUrl(dataUrl), data)
}

/** Fetch and denormalize schema JSON; dedupes concurrent requests and caches the result. */
export async function preloadSchemaData(dataUrl: string): Promise<SchemaData | null> {
  const key = normalizeDataUrl(dataUrl)
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
      if (!isSchemaBuildSupported(schemaBuild, dataUrl)) {
        const message = unsupportedSchemaBuildMessage(schemaBuild)
        loadErrors.set(key, message)
        inflight.delete(key)
        return null
      }

      clearSchemaLoadError(dataUrl)
      const data = processRawSchemaPayload(raw, { dataUrl })
      if (data) {
        storeSchemaData(dataUrl, data)
        void ensureIconsForPresetUsage(data.rawPresets).then(() => {
          refreshPresetSearchIndex(dataUrl, data.presets)
        })
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
