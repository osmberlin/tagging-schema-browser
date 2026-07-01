import { useMemo } from 'react'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { exportFields } from '@/utils/pageExports'
import { FieldCard } from './FieldCard'
import { applyFieldFacets, useFieldFacetState } from './useFieldFacetState'
import { useFieldSearch } from './useFieldSearch'

export function PageFields() {
  const { data, loading, dataUrl } = useSchema()
  const [facetState, setFacetState] = useFieldFacetState()
  const { fields } = useFieldSearch(
    data?.fields ?? {},
    data?.presets ?? [],
    data?.fieldTranslations ?? {},
  )
  const filtered = useMemo(() => {
    if (!data) return []
    return applyFieldFacets(fields, facetState)
  }, [data, fields, facetState])
  const exportData = useMemo(() => exportFields(filtered), [filtered])

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
          <AreaIcon area="fields" className={`h-7 w-7 ${areaAccent.fields.icon}`} />
          Fields <CountPill className="text-sm">{filtered.length}</CountPill>
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Sort
            <select
              value={facetState.f_sort}
              onChange={(e) =>
                setFacetState({
                  f_sort: e.target.value as 'name' | 'label' | 'usage_desc' | 'usage_asc',
                })
              }
              className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm transition ${areaAccent.fields.focus}`}
            >
              <option value="usage_desc">Usage (high to low)</option>
              <option value="usage_asc">Usage (low to high)</option>
              <option value="label">Label</option>
              <option value="name">Id</option>
            </select>
          </label>
          <DownloadButton
            filename="fields.json"
            data={exportData}
            disabled={exportData.length === 0}
          />
        </div>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {filtered.map((field) => (
          <li key={field.id}>
            <FieldCard field={field} />
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No fields match the current filters.
        </p>
      ) : null}
    </div>
  )
}
