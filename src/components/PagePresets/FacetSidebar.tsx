import { useState } from 'react'
import { stableFacetBuckets } from '@/components/PagePresets/facetOrder'
import type { SearchState } from '@/components/PagePresets/useSearchState'
import type { SchemaArea } from '@/components/ui/areaIcons'
import { SidebarSection } from '@/components/ui/Sidebar'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import { usePresetSearch } from './usePresetSearch'
import { useSearchState } from './useSearchState'

type Bucket = { key: string; doc_count: number }

type TriStateFacetKey = 'template' | 'searchable'

function bucketCount(buckets: Bucket[] | undefined, key: string): number {
  return buckets?.find((bucket) => bucket.key === key)?.doc_count ?? 0
}

function TriStateFacetGroup({
  title,
  facet,
  buckets,
  value,
  onChange,
}: {
  title: string
  facet: TriStateFacetKey
  buckets: Bucket[]
  value: SearchState[TriStateFacetKey]
  onChange: (next: SearchState[TriStateFacetKey]) => void
}) {
  const yes = bucketCount(buckets, 'yes')
  const no = bucketCount(buckets, 'no')
  const both = yes + no
  const options: { value: SearchState[TriStateFacetKey]; label: string; count: number }[] = [
    { value: 'both', label: 'Both', count: both },
    { value: 'yes', label: 'Yes', count: yes },
    { value: 'no', label: 'No', count: no },
  ]

  return (
    <SidebarSection title={title}>
      <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
        {options.map((option) => {
          const active = value === option.value
          return (
            <li key={`${facet}-${option.value}`} className="relative">
              <button
                type="button"
                onClick={() => onChange(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 py-0.5 pl-4 text-left text-sm transition before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
                  active
                    ? areaAccent.presets.facetSelected
                    : 'text-slate-600 before:hidden before:bg-slate-300 hover:text-slate-900 hover:before:block',
                )}
              >
                <span className="truncate">{option.label}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {option.count}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </SidebarSection>
  )
}

function FacetGroup({
  title,
  area,
  buckets,
  selected,
  onToggle,
  formatLabel,
}: {
  title: string
  area?: SchemaArea
  buckets: Bucket[]
  selected: string[]
  onToggle: (key: string) => void
  formatLabel?: (key: string) => string
}) {
  const [showEmpty, setShowEmpty] = useState(false)
  if (!buckets?.length) return null
  const hiddenCount = buckets.filter((b) => b.doc_count === 0 && !selected.includes(b.key)).length
  const visible = showEmpty
    ? buckets
    : buckets.filter((b) => b.doc_count > 0 || selected.includes(b.key))
  return (
    <SidebarSection title={title} area={area}>
      <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
        {visible.map(({ key, doc_count }) => {
          const isSelected = selected.includes(key)
          const disabled = doc_count === 0 && !isSelected
          return (
            <li key={key} className="relative">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(key)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 py-0.5 pl-4 text-left text-sm transition before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
                  isSelected
                    ? areaAccent.presets.facetSelected
                    : disabled
                      ? 'text-slate-300 before:hidden'
                      : 'text-slate-600 before:hidden before:bg-slate-300 hover:text-slate-900 hover:before:block',
                )}
              >
                <span className="truncate">
                  {formatLabel ? formatLabel(key) : key || '(empty)'}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    disabled ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {doc_count}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowEmpty((v) => !v)}
          className={cn(
            'mt-1 pl-4 text-left text-xs font-medium hover:underline',
            areaAccent.presets.facetShowMore,
          )}
        >
          {showEmpty ? 'Hide empty' : `Show ${hiddenCount} with no results`}
        </button>
      ) : null}
    </SidebarSection>
  )
}

export function FacetSidebar() {
  const result = usePresetSearch()
  const [state, setState] = useSearchState()

  if (!result) {
    return (
      <div className="mt-4 text-sm text-slate-500">Facets appear after schema data is loaded.</div>
    )
  }

  const agg = result.aggregations ?? {}

  const toggle = (facet: keyof typeof state) => (key: string) => {
    const arr = state[facet] as string[]
    const next = arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]
    setState({ [facet]: next, page: 1 })
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <TriStateFacetGroup
        title="Template"
        facet="template"
        buckets={agg.template?.buckets ?? []}
        value={state.template}
        onChange={(template) => setState({ template, page: 1 })}
      />
      <TriStateFacetGroup
        title="Searchable"
        facet="searchable"
        buckets={agg.searchable?.buckets ?? []}
        value={state.searchable}
        onChange={(searchable) => setState({ searchable, page: 1 })}
      />
      <FacetGroup
        title="Category"
        buckets={stableFacetBuckets('categoryFacet', agg.categoryFacet?.buckets ?? [])}
        selected={state.categoryNames}
        onToggle={(k) => toggle('categoryNames')(k)}
      />
      <FacetGroup
        title="Primary tag"
        buckets={stableFacetBuckets('primaryTagKey', agg.primaryTagKey?.buckets ?? [])}
        selected={state.primaryTagKey}
        onToggle={(k) => toggle('primaryTagKey')(k)}
      />
      <FacetGroup
        title="Geometry"
        buckets={stableFacetBuckets('geometry', agg.geometry?.buckets ?? [])}
        selected={state.geometry}
        onToggle={(k) => toggle('geometry')(k)}
      />
      <FacetGroup
        title="Icon set"
        area="icons"
        buckets={stableFacetBuckets('iconPrefix', agg.iconPrefix?.buckets ?? [])}
        selected={state.iconPrefix}
        onToggle={(k) => toggle('iconPrefix')(k)}
      />
      <FacetGroup
        title="Fields"
        area="fields"
        buckets={stableFacetBuckets('fieldIds', agg.fieldIds?.buckets ?? [])}
        selected={state.fieldIds}
        onToggle={(k) => toggle('fieldIds')(k)}
      />
      <FacetGroup
        title="Has icon"
        area="icons"
        buckets={stableFacetBuckets('hasIcon', agg.hasIcon?.buckets ?? [])}
        selected={state.hasIcon}
        onToggle={(k) => toggle('hasIcon')(k)}
      />
      <FacetGroup
        title="Icon consistency"
        area="icons"
        buckets={stableFacetBuckets('iconMismatch', agg.iconMismatch?.buckets ?? [])}
        selected={state.iconMismatch}
        onToggle={(k) => toggle('iconMismatch')(k)}
      />
    </div>
  )
}
