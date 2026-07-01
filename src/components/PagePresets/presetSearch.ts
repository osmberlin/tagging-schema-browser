import itemsjs from 'itemsjs'
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
    hasIconFacet: p.iconBroken ? 'broken' : p.hasIcon ? 'yes' : 'no',
  }))
}

const itemsJsConfig = {
  searchableFields: ['name', 'termsText', 'aliasesText', 'id', 'tagString', 'fieldText'],
  aggregations: {
    categoryFacet: { title: 'Category', size: 50, conjunction: false },
    primaryTagKey: { title: 'Primary tag', size: 50, sort: 'count', order: 'desc' },
    geometry: { title: 'Geometry', size: 10, conjunction: false },
    iconPrefix: { title: 'Icon set', size: 15 },
    // Filterable so "Show presets" from an icon (and the iconName pill) works.
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

let engine: ReturnType<typeof itemsjs> | null = null

export function buildPresetSearchIndex(presets: DenormalizedPreset[]): void {
  const records = toItemsJsRecords(presets)
  engine = itemsjs(records, itemsJsConfig as never)
}

export function searchPresets(params: {
  query?: string
  filters?: Record<string, string[]>
  page?: number
  per_page?: number
  sort?: string
}): PresetSearchResult | null {
  if (!engine) return null
  const mappedFilters: Record<string, string[]> = { ...params.filters }
  if (mappedFilters.hasIcon) {
    mappedFilters.hasIconFacet = mappedFilters.hasIcon
    mappedFilters.hasIcon = []
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
    aggregations:
      aggregations && 'hasIconFacet' in aggregations
        ? {
            ...aggregations,
            hasIcon: (
              aggregations as Record<string, { buckets: { key: string; doc_count: number }[] }>
            ).hasIconFacet,
          }
        : aggregations,
  }
}
