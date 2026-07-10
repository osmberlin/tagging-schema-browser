import { activatePresetSearchIndex } from '@/components/PagePresets/presetSearch'
import { getCachedSchemaData, getSchemaLoadError, preloadSchemaData } from '@/utils/schemaCache'
import type { SchemaData } from '@/utils/types'

export const schemaKeys = {
  all: ['schema'] as const,
  data: (url: string) => [...schemaKeys.all, 'data', url] as const,
}

async function loadSchemaData(dataUrl: string): Promise<SchemaData> {
  const data = await preloadSchemaData(dataUrl)
  if (!data) {
    throw new Error(getSchemaLoadError(dataUrl) ?? 'Failed to load schema data')
  }
  return data
}

/** Active schema fetch — also binds the preset search index to this URL. */
export async function fetchSchemaData(dataUrl: string): Promise<SchemaData> {
  const data = await loadSchemaData(dataUrl)
  activatePresetSearchIndex(dataUrl, data.presets)
  return data
}

/** Background prefetch — warms cache without changing the active search index. */
export async function prefetchSchemaData(dataUrl: string): Promise<SchemaData> {
  return loadSchemaData(dataUrl)
}

export function cachedSchemaData(dataUrl: string): SchemaData | undefined {
  return getCachedSchemaData(dataUrl) ?? undefined
}
