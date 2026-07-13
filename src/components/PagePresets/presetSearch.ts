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

function normalizeDataUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

let activeDataUrl: string | null = null
let engine: PresetSearchEngine | null = null
let cachedIconEpoch = -1

/** Bind the itemsjs engine to the active schema URL. Preload must not call this. */
export function activatePresetSearchIndex(dataUrl: string, presets: DenormalizedPreset[]): void {
  const key = normalizeDataUrl(dataUrl)
  if (activeDataUrl === key && engine) return
  refreshPresetSearchIndex(dataUrl, presets)
  cachedIconEpoch = 0
}

/** Rebuild facet buckets after async icon suppliers finish loading. */
export function refreshPresetSearchIndex(
  dataUrl: string,
  presets: DenormalizedPreset[],
  iconEpoch?: number,
): void {
  const key = normalizeDataUrl(dataUrl)
  activeDataUrl = key
  engine = itemsjs(toItemsJsRecords(presets), itemsJsConfig as never)
  if (iconEpoch !== undefined) cachedIconEpoch = iconEpoch
}

/** Idempotent — safe during render when the active schema is on screen. */
export function ensurePresetSearchIndex(
  dataUrl: string,
  presets: DenormalizedPreset[],
  iconEpoch = 0,
): void {
  const key = normalizeDataUrl(dataUrl)
  const needsIconRefresh = iconEpoch !== cachedIconEpoch
  if (activeDataUrl === key && engine && !needsIconRefresh) return
  if (activeDataUrl === key && engine && needsIconRefresh) {
    refreshPresetSearchIndex(dataUrl, presets)
    cachedIconEpoch = iconEpoch
    return
  }
  activatePresetSearchIndex(dataUrl, presets)
  cachedIconEpoch = iconEpoch
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
  if (!engine || !activeDataUrl) return null
  const mappedFilters: Record<string, string[]> = { ...params.filters }
  if (mappedFilters.hasIcon) {
    mappedFilters.hasIconFacet = mappedFilters.hasIcon
    mappedFilters.hasIcon = []
  }
  if (mappedFilters.missingInheritance) {
    mappedFilters.missingInheritanceFacet = mappedFilters.missingInheritance
    mappedFilters.missingInheritance = []
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
