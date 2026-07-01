import { buildPresetSearchIndex } from '@/components/PagePresets/presetSearch'
import { getCachedSchemaData, getSchemaLoadError, preloadSchemaData } from '@/utils/schemaCache'
import type { SchemaData } from '@/utils/types'

export const schemaKeys = {
  all: ['schema'] as const,
  data: (url: string) => [...schemaKeys.all, 'data', url] as const,
}

export async function fetchSchemaData(dataUrl: string): Promise<SchemaData> {
  const data = await preloadSchemaData(dataUrl)
  if (!data) {
    throw new Error(getSchemaLoadError(dataUrl) ?? 'Failed to load schema data')
  }
  buildPresetSearchIndex(data.presets)
  return data
}

export function cachedSchemaData(dataUrl: string): SchemaData | undefined {
  const cached = getCachedSchemaData(dataUrl)
  if (cached) {
    buildPresetSearchIndex(cached.presets)
  }
  return cached ?? undefined
}
