import { useEffect, useMemo } from 'react'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { FieldIconMismatchAlert, FieldRiskyTypeComboAlert } from '@/components/ui/SchemaIssueAlerts'
import { SortSelect } from '@/components/ui/SortSelect'
import { VirtualizedGrid } from '@/components/ui/VirtualizedGrid'
import { useSchemaIssueDisclosureActions } from '@/features/schema-issue/schema-issue-disclosure-store'
import { useDeferredSearchQuery } from '@/hooks/useDeferredSearchQuery'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { activeFieldIssueFilter, showFieldIssueAlert } from '@/utils/fieldIssueFilters'
import { exportFields } from '@/utils/pageExports'
import { FieldCard } from './FieldCard'
import { applyFieldFacets, useFieldFacetState } from './useFieldFacetState'
import { useFieldSearch } from './useFieldSearch'

const FIELD_CARD_MIN_WIDTH = 220
const FIELD_CARD_GAP = 12
const FIELD_CARD_ROW_ESTIMATE = 224

export function PageFields() {
  const { data, loading, dataUrl } = useSchema()
  const [facetState, setFacetState] = useFieldFacetState()
  const { fields } = useFieldSearch()
  const { f_q, f_type, f_usage, f_iconMismatch, f_sort, f_optionIcon } = facetState
  const { deferredQuery, isSearchPending } = useDeferredSearchQuery(f_q)
  const filtered = useMemo(() => {
    if (!data) return []
    return applyFieldFacets(fields, {
      f_q: deferredQuery,
      f_type,
      f_usage,
      f_iconMismatch,
      f_sort,
      f_optionIcon,
    })
  }, [data, fields, deferredQuery, f_type, f_usage, f_iconMismatch, f_sort, f_optionIcon])
  const mismatchFieldCount = fields.filter((field) => field.iconMismatchCount > 0).length
  const riskyTypeComboFieldCount = fields.filter(
    (field) => field.type === 'typeCombo' && field.riskyUsageCount > 0,
  ).length
  const activeIssueFilter = activeFieldIssueFilter(facetState)
  const { setActiveIssueFocus } = useSchemaIssueDisclosureActions()

  useEffect(() => {
    setActiveIssueFocus(activeIssueFilter)
  }, [activeIssueFilter, setActiveIssueFocus])

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
          Fields{' '}
          <CountPill className="text-sm">
            {filtered.length}
            {isSearchPending ? <span className="sr-only"> — filtering</span> : null}
          </CountPill>
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <SortSelect
            value={facetState.f_sort}
            onChange={(value) =>
              setFacetState({
                f_sort: value as 'name' | 'label' | 'usage_desc' | 'usage_asc',
              })
            }
            aria-label="Sort fields"
            area="fields"
          >
            <option value="usage_desc">Usage (high to low)</option>
            <option value="usage_asc">Usage (low to high)</option>
            <option value="label">Label</option>
            <option value="name">Id</option>
          </SortSelect>
          <DownloadButton
            filename="fields.json"
            data={exportData}
            disabled={exportData.length === 0}
          />
        </div>
      </div>
      {facetState.f_optionIcon ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFacetState({ f_optionIcon: '' })}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${areaAccent.icons.sharedChip}`}
          >
            <AreaIcon area="icons" className={`h-3 w-3 ${areaAccent.icons.icon}`} />
            Option icon: {facetState.f_optionIcon}
            <span aria-hidden className="text-slate-400">
              ×
            </span>
          </button>
        </div>
      ) : null}
      {showFieldIssueAlert(activeIssueFilter, 'iconMismatch') ? (
        <FieldIconMismatchAlert
          count={mismatchFieldCount}
          onShowMismatch={() => setFacetState({ f_iconMismatch: 'mismatch' })}
        />
      ) : null}
      <FieldRiskyTypeComboAlert count={riskyTypeComboFieldCount} dataUrl={dataUrl ?? ''} />
      {filtered.length > 0 ? (
        <VirtualizedGrid
          items={filtered}
          minColumnWidth={FIELD_CARD_MIN_WIDTH}
          gap={FIELD_CARD_GAP}
          rowEstimate={FIELD_CARD_ROW_ESTIMATE}
          busy={isSearchPending}
          getKey={(field) => field.id}
          renderItem={(field) => <FieldCard field={field} />}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No fields match the current filters.
        </p>
      )}
    </div>
  )
}
