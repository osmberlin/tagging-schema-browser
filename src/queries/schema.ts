import { activatePresetSearchIndex } from '@/components/PagePresets/presetSearch'
import { getCachedSchemaData, getSchemaLoadError, preloadSchemaData } from '@/utils/schemaCache'
import type { SchemaData } from '@/utils/types'

export const schemaKeys = {
  all: ['schema'] as const,
  data: (url: string, allowLegacy: boolean) =>
    [...schemaKeys.all, 'data', url, allowLegacy] as const,
}

async function loadSchemaData(dataUrl: string, allowLegacy: boolean): Promise<SchemaData> {
  const data = await preloadSchemaData(dataUrl, { allowLegacy })
  if (!data) {
    throw new Error(getSchemaLoadError(dataUrl, allowLegacy) ?? 'Failed to load schema data')
  }
  return data
}

/** Active schema fetch — also binds the preset search index to this URL. */
export async function fetchSchemaData(
  dataUrl: string,
  options: { allowLegacy?: boolean } = {},
): Promise<SchemaData> {
  const allowLegacy = options.allowLegacy ?? false
  const data = await loadSchemaData(dataUrl, allowLegacy)
  activatePresetSearchIndex(dataUrl, data.presets)
  return data
}

/** Background prefetch — warms cache without changing the active search index. */
export async function prefetchSchemaData(
  dataUrl: string,
  options: { allowLegacy?: boolean } = {},
): Promise<SchemaData> {
  const allowLegacy = options.allowLegacy ?? false
  return loadSchemaData(dataUrl, allowLegacy)
}

export function cachedSchemaData(dataUrl: string, allowLegacy = false): SchemaData | undefined {
  return getCachedSchemaData(dataUrl, allowLegacy) ?? undefined
}
