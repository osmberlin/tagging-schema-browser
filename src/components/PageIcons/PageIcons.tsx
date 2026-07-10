import { useMemo } from 'react'
import { AreaIcon } from '@/components/ui/areaIcons'
import { BrokenPresetIconsBanner } from '@/components/ui/BrokenPresetIconsBanner'
import { CountPill } from '@/components/ui/CountPill'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { useBrokenPresetIconCount } from '@/hooks/useBrokenPresetIconCount'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { exportIcons } from '@/utils/pageExports'
import { IconCard } from './IconCard'
import { applyIconFacets, useIconFacetState } from './useIconFacetState'
import { useIconSearch } from './useIconSearch'

export function PageIcons() {
  const { data, loading, dataUrl } = useSchema()
  const [facetState, setFacetState] = useIconFacetState()
  const brokenPresetIconCount = useBrokenPresetIconCount(data?.presets ?? [])
  const { icons } = useIconSearch(
    data?.presets ?? [],
    data?.fields ?? {},
    data?.fieldTranslations ?? {},
  )
  const filtered = useMemo(() => {
    if (!data) return []
    return applyIconFacets(icons, facetState)
  }, [data, icons, facetState])
  const exportData = useMemo(() => exportIcons(filtered), [filtered])

  if (!dataUrl && !data) {
    return (
      <p className="text-sm text-slate-500">
        Load schema data from the Presets page first (enter a data URL and click Load).
      </p>
    )
  }

  if (loading && !data) {
    return <SchemaLoadingPanel />
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          <AreaIcon area="icons" className={`h-7 w-7 ${areaAccent.icons.icon}`} />
          Icons <CountPill className="text-sm">{filtered.length}</CountPill>
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Sort
            <select
              value={facetState.i_sort}
              onChange={(e) =>
                setFacetState({ i_sort: e.target.value as 'name' | 'usage_desc' | 'usage_asc' })
              }
              className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm transition ${areaAccent.icons.focus}`}
            >
              <option value="name">Name</option>
              <option value="usage_desc">Usage (high to low)</option>
              <option value="usage_asc">Usage (low to high)</option>
            </select>
          </label>
          <DownloadButton
            filename="icons.json"
            data={exportData}
            disabled={exportData.length === 0}
          />
        </div>
      </div>
      <BrokenPresetIconsBanner
        count={brokenPresetIconCount}
        onShowBroken={() => setFacetState({ i_hasSvg: 'missing', i_usage: 'presets' })}
      />
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {filtered.map((icon) => (
          <li key={icon.name} className="h-full">
            <IconCard
              iconName={icon.name}
              svgRaw={icon.svgRaw}
              presetUsageCount={icon.presetUsageCount}
              optionUsageCount={icon.optionUsageCount}
              presets={icon.presets}
              optionUsages={icon.optionUsages}
            />
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No icons match the current filters.
        </p>
      )}
    </div>
  )
}
