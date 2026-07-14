import { useMemo } from 'react'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { BrokenPresetIconsAlert } from '@/components/ui/SchemaIssueAlerts'
import { VirtualizedGrid } from '@/components/ui/VirtualizedGrid'
import { useBrokenPresetIconCount } from '@/hooks/useBrokenPresetIconCount'
import { useDeferredSearchQuery } from '@/hooks/useDeferredSearchQuery'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { exportIcons } from '@/utils/pageExports'
import { IconCard } from './IconCard'
import { useIconsPage } from './IconsPageContext'
import { flattenIconUsages, sortIconUsageRows } from './iconUsageRows'
import { IconUsageTable } from './IconUsageTable'
import { applyIconFacets, useIconFacetState } from './useIconFacetState'

const ICON_CARD_MIN_WIDTH = 180
const ICON_CARD_GAP = 12
const ICON_CARD_ROW_ESTIMATE = 208

export function PageIcons() {
  const { data, dataUrl } = useSchema()
  const [facetState, setFacetState] = useIconFacetState()
  const { icons, suppliersReady } = useIconsPage()
  const brokenPresetIconCount = useBrokenPresetIconCount(data?.presets ?? [])
  const { i_q, i_supplier, i_usage, i_hasSvg, i_sort, i_view } = facetState
  const { deferredQuery, isSearchPending } = useDeferredSearchQuery(i_q)
  const filtered = useMemo(() => {
    if (!data) return []
    return applyIconFacets(icons, {
      i_q: deferredQuery,
      i_supplier,
      i_usage,
      i_hasSvg,
      i_sort,
      i_view,
    })
  }, [data, icons, deferredQuery, i_supplier, i_usage, i_hasSvg, i_sort, i_view])
  const usageRows = useMemo(() => {
    if (!data || i_view !== 'usages') return []
    const rows = flattenIconUsages(filtered, data.fields, data.fieldTranslations)
    return sortIconUsageRows(rows, filtered, i_sort)
  }, [data, filtered, i_sort, i_view])
  const exportData = useMemo(() => exportIcons(filtered), [filtered])

  if (!dataUrl && !data) {
    return (
      <p className="text-sm text-slate-500">
        Load schema data from the Presets page first (enter a data URL and click Load).
      </p>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          <AreaIcon area="icons" className={`h-7 w-7 ${areaAccent.icons.icon}`} />
          Icons{' '}
          <CountPill className="text-sm">
            {i_view === 'usages'
              ? `${filtered.length} icons · ${usageRows.length} usages`
              : filtered.length}
            {isSearchPending ? <span className="sr-only"> — filtering</span> : null}
          </CountPill>
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm"
            role="group"
            aria-label="View"
          >
            {(
              [
                ['cards', 'Cards'],
                ['usages', 'Usages'],
              ] as const
            ).map(([value, label]) => {
              const active = i_view === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFacetState({ i_view: value })}
                  className={`px-3 py-1.5 text-sm font-medium transition not-last:border-r not-last:border-slate-300 ${
                    active
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <select
            value={i_sort}
            onChange={(e) =>
              setFacetState({ i_sort: e.target.value as 'name' | 'usage_desc' | 'usage_asc' })
            }
            aria-label="Sort icons"
            className={`min-w-[12.5rem] rounded-lg border border-slate-300 bg-white py-1.5 pr-9 pl-3 text-sm text-slate-900 shadow-sm transition ${areaAccent.icons.focus}`}
          >
            <option value="name">Name</option>
            <option value="usage_desc">Usage (high to low)</option>
            <option value="usage_asc">Usage (low to high)</option>
          </select>
          <DownloadButton
            filename="icons.json"
            data={exportData}
            disabled={exportData.length === 0}
          />
        </div>
      </div>
      {facetState.i_hasSvg !== 'missing' || facetState.i_usage !== 'presets' ? (
        <BrokenPresetIconsAlert
          count={brokenPresetIconCount}
          onShowBroken={() => setFacetState({ i_hasSvg: 'missing', i_usage: 'presets' })}
        />
      ) : null}
      {i_view === 'usages' ? (
        <IconUsageTable rows={usageRows} busy={isSearchPending} />
      ) : filtered.length > 0 ? (
        <VirtualizedGrid
          items={filtered}
          minColumnWidth={ICON_CARD_MIN_WIDTH}
          gap={ICON_CARD_GAP}
          rowEstimate={ICON_CARD_ROW_ESTIMATE}
          busy={isSearchPending}
          getKey={(icon) => icon.name}
          renderItem={(icon) => (
            <IconCard
              iconName={icon.name}
              svgRaw={icon.svgRaw}
              presetUsageCount={icon.presetUsageCount}
              optionUsageCount={icon.optionUsageCount}
              presets={icon.presets}
              optionUsages={icon.optionUsages}
            />
          )}
        />
      ) : null}
      {filtered.length === 0 && suppliersReady && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No icons match the current filters.
        </p>
      )}
    </div>
  )
}
