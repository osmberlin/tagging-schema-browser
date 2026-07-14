export type PresetSourceTreeKind = 'field' | 'preset'

const warmedKeys = new Set<string>()

function normalizeDataUrl(dataUrl: string): string {
  return dataUrl.endsWith('/') ? dataUrl : `${dataUrl}/`
}

export function presetSourceTreeCacheKey(params: {
  sourceKind: PresetSourceTreeKind
  entityId: string
  dataUrl: string
}): string {
  return `${normalizeDataUrl(params.dataUrl)}\0${params.sourceKind}\0${params.entityId}`
}

export function isPresetSourceTreeWarm(cacheKey: string): boolean {
  return warmedKeys.has(cacheKey)
}

export function markPresetSourceTreeWarm(cacheKey: string): void {
  warmedKeys.add(cacheKey)
}

/** Clear session cache when switching schema dist (e.g. release ↔ interim). */
export function clearPresetSourceTreeCache(): void {
  warmedKeys.clear()
}
