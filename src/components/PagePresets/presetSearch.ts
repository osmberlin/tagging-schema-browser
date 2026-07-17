import itemsjs from 'itemsjs'
import { isIconSvgConfirmedMissing } from '@/components/PageIcons/iconRegistry'
import { isExpectedNoIconPreset } from '@/utils/presetExpectedNoIcon'
import { presetMatchesTextQuery } from '@/utils/presetTextMatch'
import type { DenormalizedPreset } from '@/utils/types'

type PresetSearchRecord = DenormalizedPreset & {
  termsText: string
  aliasesText: string
  fieldText: string
  fieldIds: string[]
  primaryFieldIds: string[]
  moreFieldIds: string[]
  iconName: string
  hasIconFacet: 'yes' | 'no' | 'broken'
  iconMismatchFacet: 'mismatch' | 'no'
  missingInheritanceFacet: DenormalizedPreset['missingInheritanceStatus']
  riskyTypeComboFacet: DenormalizedPreset['riskyTypeComboStatus']
  templateFacet: 'yes' | 'no'
  searchableFacet: 'yes' | 'no'
  expectedNoIconFacet: 'yes' | 'no'
}

function toItemsJsRecords(presets: DenormalizedPreset[]): Record<string, unknown>[] {
  return presets.map((p) => ({
    ...p,
    termsText: p.terms.join(' '),
    aliasesText: p.aliases.join(' '),
    fieldText: [...p.fields, ...p.moreFields].join(' '),
    fieldIds: Array.from(new Set([...p.fields, ...p.moreFields])),
    primaryFieldIds: p.fields,
    moreFieldIds: p.moreFields,
    categoryFacet: p.categoryNames.length > 0 ? p.categoryNames : (['No Category'] as string[]),
    primaryTagKey: p.primaryTagKey ?? '',
    iconName: p.icon ?? '',
    iconPrefix: p.iconPrefix ?? 'none',
    hasIconFacet: p.icon && isIconSvgConfirmedMissing(p.icon) ? 'broken' : p.hasIcon ? 'yes' : 'no',
    iconMismatchFacet: p.iconMismatch ? 'mismatch' : 'no',
    missingInheritanceFacet: p.missingInheritanceStatus,
    riskyTypeComboFacet: p.riskyTypeComboStatus,
    templateFacet: p.isTemplate ? 'yes' : 'no',
    searchableFacet: p.searchable === false ? 'no' : 'yes',
    expectedNoIconFacet: isExpectedNoIconPreset(p) ? 'yes' : 'no',
  }))
}

const itemsJsConfig = {
  searchableFields: ['name', 'termsText', 'aliasesText', 'id', 'tagString', 'fieldText'],
  aggregations: {
    categoryFacet: { title: 'Category', size: 50, conjunction: false },
    primaryTagKey: { title: 'Primary tag', size: 50, sort: 'count', order: 'desc' },
    geometry: { title: 'Geometry', size: 10, conjunction: false },
    iconPrefix: { title: 'Icon set', size: 15 },
    iconName: { title: 'Icon', size: 2000, conjunction: false },
    fieldIds: { title: 'Fields', size: 100, sort: 'count', order: 'desc', conjunction: false },
    primaryFieldIds: {
      title: 'Primary fields',
      size: 100,
      sort: 'count',
      order: 'desc',
      conjunction: false,
    },
    moreFieldIds: {
      title: 'More fields',
      size: 100,
      sort: 'count',
      order: 'desc',
      conjunction: false,
    },
    hasIconFacet: { title: 'Has icon', size: 3 },
    iconMismatchFacet: { title: 'Icon consistency', size: 2 },
    missingInheritanceFacet: { title: 'Field inheritance', size: 4 },
    riskyTypeComboFacet: { title: 'Field type safety', size: 4 },
    templateFacet: { title: 'Template', size: 2 },
    searchableFacet: { title: 'Searchable', size: 2 },
    expectedNoIconFacet: { title: 'Expected no icon', size: 2 },
  },
  sortings: {
    name_asc: { field: 'name', order: 'asc' },
    name_desc: { field: 'name', order: 'desc' },
  },
}

export type PresetSearchResult = {
  data: { items: DenormalizedPreset[]; total: number; per_page: number; page: number }
  aggregations: Record<string, { buckets: { key: string; doc_count: number }[] }>
}

/** Upper bound for itemsjs `per_page` — well above any real schema size. */
export const PRESET_SEARCH_ALL = 100_000

type PresetSearchEngine = {
  search: (params: Record<string, unknown>) => unknown
}

type PresetSearchIndexEntry = {
  engine: PresetSearchEngine
  iconEpoch: number
}

function normalizeDataUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/** One itemsjs engine per schema URL — background prefetch must not repoint the active index. */
const enginesByDataUrl = new Map<string, PresetSearchIndexEntry>()
let activeDataUrl: string | null = null

export function getActivePresetSearchDataUrl(): string | null {
  return activeDataUrl
}

function buildEngine(presets: DenormalizedPreset[]): PresetSearchEngine {
  return itemsjs(toItemsJsRecords(presets), itemsJsConfig as never)
}

function setEngineForUrl(
  dataUrl: string,
  presets: DenormalizedPreset[],
  iconEpoch: number,
): PresetSearchIndexEntry {
  const key = normalizeDataUrl(dataUrl)
  const entry: PresetSearchIndexEntry = { engine: buildEngine(presets), iconEpoch }
  enginesByDataUrl.set(key, entry)
  return entry
}

function getEngineEntry(dataUrl: string): PresetSearchIndexEntry | undefined {
  return enginesByDataUrl.get(normalizeDataUrl(dataUrl))
}

/** Bind search results to a schema URL. Reuses a cached engine when already built. */
export function activatePresetSearchIndex(dataUrl: string, presets: DenormalizedPreset[]): void {
  const key = normalizeDataUrl(dataUrl)
  activeDataUrl = key
  if (!enginesByDataUrl.has(key)) {
    setEngineForUrl(dataUrl, presets, 0)
  }
}

/** Rebuild facet buckets for one schema URL (e.g. after async icons load). Does not change active URL. */
export function refreshPresetSearchIndex(
  dataUrl: string,
  presets: DenormalizedPreset[],
  iconEpoch?: number,
): void {
  const epoch = iconEpoch ?? getEngineEntry(dataUrl)?.iconEpoch ?? 0
  setEngineForUrl(dataUrl, presets, epoch)
}

/** Idempotent — safe during render when the active schema is on screen. */
export function ensurePresetSearchIndex(
  dataUrl: string,
  presets: DenormalizedPreset[],
  iconEpoch = 0,
): void {
  const key = normalizeDataUrl(dataUrl)
  const cached = getEngineEntry(dataUrl)
  const needsIconRefresh = cached !== undefined && cached.iconEpoch !== iconEpoch

  if (activeDataUrl === key && cached && !needsIconRefresh) return

  if (activeDataUrl === key && cached && needsIconRefresh) {
    refreshPresetSearchIndex(dataUrl, presets, iconEpoch)
    return
  }

  if (cached && !needsIconRefresh) {
    activeDataUrl = key
    return
  }

  activeDataUrl = key
  if (cached && needsIconRefresh) {
    refreshPresetSearchIndex(dataUrl, presets, iconEpoch)
    return
  }

  setEngineForUrl(dataUrl, presets, iconEpoch)
}

/** When filtering only `hasIcon: no`, drop presets that are expected to lack icons. */
export function shouldExcludeExpectedNoIconPresets(hasIconFacet: string[] | undefined): boolean {
  if (!hasIconFacet?.includes('no')) return false
  return !hasIconFacet.includes('yes') && !hasIconFacet.includes('broken')
}

export function searchPresets(params: {
  query?: string
  filters?: Record<string, string[]>
  page?: number
  per_page?: number
  sort?: string
}): PresetSearchResult | null {
  const entry = activeDataUrl ? enginesByDataUrl.get(activeDataUrl) : undefined
  if (!entry) return null
  const engine = entry.engine
  const mappedFilters: Record<string, string[]> = { ...params.filters }
  if (mappedFilters.hasIcon) {
    mappedFilters.hasIconFacet = mappedFilters.hasIcon
    mappedFilters.hasIcon = []
  }
  if (mappedFilters.missingInheritance) {
    mappedFilters.missingInheritanceFacet = mappedFilters.missingInheritance
    mappedFilters.missingInheritance = []
  }
  if (mappedFilters.riskyTypeCombo) {
    mappedFilters.riskyTypeComboFacet = mappedFilters.riskyTypeCombo
    mappedFilters.riskyTypeCombo = []
  }
  if (mappedFilters.iconMismatch) {
    mappedFilters.iconMismatchFacet = mappedFilters.iconMismatch
    mappedFilters.iconMismatch = []
  }
  if (mappedFilters.template) {
    mappedFilters.templateFacet = mappedFilters.template
    mappedFilters.template = []
  }
  if (mappedFilters.searchable) {
    mappedFilters.searchableFacet = mappedFilters.searchable
    mappedFilters.searchable = []
  }
  if (shouldExcludeExpectedNoIconPresets(mappedFilters.hasIconFacet)) {
    mappedFilters.expectedNoIconFacet = ['no']
  }
  const query = params.query ?? ''
  const useCustomTextFilter = query.trim().length > 0
  const result = engine.search({
    query: useCustomTextFilter ? '' : query,
    filters: mappedFilters,
    filter: useCustomTextFilter
      ? (item: Record<string, unknown>) => presetMatchesTextQuery(item as DenormalizedPreset, query)
      : undefined,
    page: params.page ?? 1,
    per_page: params.per_page ?? 24,
    sort: params.sort ?? 'name_asc',
  }) as unknown as {
    data?: {
      items?: unknown[]
      aggregations?: PresetSearchResult['aggregations']
    }
    pagination?: { total?: number; per_page?: number; page?: number }
  }

  const d = result.data
  const p = result.pagination
  const items = d?.items ?? []
  const total = p?.total ?? items.length
  const perPage = p?.per_page ?? 24
  const page = p?.page ?? 1
  const aggregations = d?.aggregations ?? {}

  return {
    data: {
      items: (items as PresetSearchRecord[]).map((item) => {
        const {
          termsText,
          aliasesText,
          hasIconFacet,
          iconMismatchFacet,
          missingInheritanceFacet,
          riskyTypeComboFacet,
          templateFacet,
          searchableFacet,
          expectedNoIconFacet,
          fieldText,
          fieldIds,
          primaryFieldIds,
          moreFieldIds,
          iconName,
          ...preset
        } = item
        void termsText
        void aliasesText
        void hasIconFacet
        void iconMismatchFacet
        void missingInheritanceFacet
        void riskyTypeComboFacet
        void templateFacet
        void searchableFacet
        void expectedNoIconFacet
        void fieldText
        void fieldIds
        void primaryFieldIds
        void moreFieldIds
        void iconName
        return preset
      }),
      total,
      per_page: perPage,
      page,
    },
    aggregations: (() => {
      const mapped = { ...aggregations } as Record<
        string,
        { buckets: { key: string; doc_count: number }[] }
      >
      if ('hasIconFacet' in mapped) {
        mapped.hasIcon = mapped.hasIconFacet
        delete mapped.hasIconFacet
      }
      if ('missingInheritanceFacet' in mapped) {
        mapped.missingInheritance = mapped.missingInheritanceFacet
        delete mapped.missingInheritanceFacet
      }
      if ('riskyTypeComboFacet' in mapped) {
        mapped.riskyTypeCombo = mapped.riskyTypeComboFacet
        delete mapped.riskyTypeComboFacet
      }
      if ('iconMismatchFacet' in mapped) {
        mapped.iconMismatch = mapped.iconMismatchFacet
        delete mapped.iconMismatchFacet
      }
      if ('templateFacet' in mapped) {
        mapped.template = mapped.templateFacet
        delete mapped.templateFacet
      }
      if ('searchableFacet' in mapped) {
        mapped.searchable = mapped.searchableFacet
        delete mapped.searchableFacet
      }
      if ('expectedNoIconFacet' in mapped) {
        delete mapped.expectedNoIconFacet
      }
      return mapped
    })(),
  }
}
