import { Link } from '@tanstack/react-router'
import { type VirtualItem, useVirtualizer } from '@tanstack/react-virtual'
import { Fragment, type ReactNode, useMemo, useRef } from 'react'
import {
  isIconSvgConfirmedMissing,
  useIconRegistryEpoch,
  useIconSvgDataUrl,
} from '@/components/PageIcons/iconRegistry'
import { GeometryIcons } from '@/components/PagePresets/geometryIcons'
import { AreaIcon, AreaLabel, type SchemaArea } from '@/components/ui/areaIcons'
import { AreaLink } from '@/components/ui/AreaLink'
import { ExpandIcon } from '@/components/ui/ExpandIcon'
import { useComparison } from '@/hooks/useComparison'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { comparisonAccent } from '@/theme/comparisonAccent'
import { getPresetOptionIconNames } from '@/utils/fieldOptions'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset } from '@/utils/types'
import { usePresetSearch } from './usePresetSearch'
import { presetSearchDefaults } from './useSearchState'

const COLUMN_WIDTH = 160

const dash = <span className="text-slate-300">—</span>

function CellOverflow({
  children,
  truncate,
  wrap,
  breakText,
}: {
  children: ReactNode
  truncate?: boolean
  wrap?: boolean
  /** Line break + hyphenation inside the fixed column (instead of ellipsis). */
  breakText?: boolean
}) {
  return (
    <span
      className={cn(
        'block min-w-0',
        truncate && 'truncate',
        wrap && 'break-all',
        breakText && 'break-words hyphens-auto',
      )}
    >
      {children}
    </span>
  )
}

function renderCellContent(row: Row, preset: DenormalizedPreset) {
  const content = row.render(preset)
  if (row.truncate || row.wrap || row.breakText) {
    return (
      <CellOverflow truncate={row.truncate} wrap={row.wrap} breakText={row.breakText}>
        {content}
      </CellOverflow>
    )
  }
  return content
}

function IconNameCell({ iconName }: { iconName: string }) {
  const src = useIconSvgDataUrl(iconName)
  const broken = !src && isIconSvgConfirmedMissing(iconName)
  return (
    <span className="flex w-full min-w-0 items-center gap-1.5">
      {src ? (
        <img src={src} alt="" className="h-5 w-5 shrink-0 object-contain" />
      ) : broken ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-red-300 bg-red-50 text-[10px] font-semibold text-red-700"
          title="Missing icon asset"
        >
          !
        </span>
      ) : null}
      <span
        className={cn(
          'min-w-0 flex-1 truncate font-mono text-xs',
          broken && 'font-medium text-red-700',
        )}
        title={iconName}
      >
        {iconName}
      </span>
    </span>
  )
}

function isPresetIconCellBroken(icon?: string): boolean {
  return Boolean(icon && isIconSvgConfirmedMissing(icon))
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

type CellLink = {
  search: (prev: { dataUrl?: string; locale?: string }) => Record<string, unknown>
  title: string
}

type Row = {
  label: ReactNode
  /** Stable key for table rows (defaults to string label when omitted). */
  rowKey?: string
  labelTitle?: string
  mono?: boolean
  /** Truncate overflowing text with ellipsis; pair with `title` for the full value. */
  truncate?: boolean
  /** Wrap with line breaks and hyphenation inside the fixed column. */
  breakText?: boolean
  /** Break long unbroken strings (e.g. URLs) across lines inside the fixed column. */
  wrap?: boolean
  render: (p: DenormalizedPreset) => ReactNode
  title?: (p: DenormalizedPreset) => string | undefined
  highlight?: (p: DenormalizedPreset) => boolean
  /** Tailwind background class when `highlight` is true (default presets highlight). */
  highlightClass?: string
  errorHighlight?: (p: DenormalizedPreset) => boolean
  link?: (p: DenormalizedPreset) => CellLink | null
}
type Section = { title: string; area?: SchemaArea; rows: Row[] }

function ColumnSpacer({ width, as: Tag = 'th' }: { width: number; as?: 'th' | 'td' }) {
  if (width <= 0) return null
  return (
    <Tag aria-hidden className="border-0 p-0" style={{ width, minWidth: width, maxWidth: width }} />
  )
}

function VirtualizedPresetColumns({
  presets,
  virtualColumns,
  paddingLeft,
  paddingRight,
  renderColumn,
  spacerAs = 'th',
}: {
  presets: DenormalizedPreset[]
  virtualColumns: VirtualItem[]
  paddingLeft: number
  paddingRight: number
  renderColumn: (preset: DenormalizedPreset, index: number) => ReactNode
  spacerAs?: 'th' | 'td'
}) {
  return (
    <>
      <ColumnSpacer width={paddingLeft} as={spacerAs} />
      {virtualColumns.map((virtualColumn) => {
        const preset = presets[virtualColumn.index]
        if (!preset) return null
        return <Fragment key={preset.id}>{renderColumn(preset, virtualColumn.index)}</Fragment>
      })}
      <ColumnSpacer width={paddingRight} as={spacerAs} />
    </>
  )
}
function PresetHeaderCell({
  preset,
  changed,
  status,
}: {
  preset: DenormalizedPreset
  changed: boolean
  status: string | undefined
}) {
  return (
    <th
      className="sticky top-0 z-20 overflow-hidden border-r border-b border-slate-200 bg-white p-0 text-left align-bottom"
      style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, maxWidth: COLUMN_WIDTH }}
    >
      <Link
        to="/preset/$"
        params={{ _splat: preset.id }}
        search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
        title={`Open preset "${preset.id}"`}
        className={`group/col relative block h-full w-full overflow-hidden px-3 py-2 pr-8 text-left transition ${areaAccent.presets.rowHover}`}
      >
        <span
          className={`flex min-w-0 items-center gap-1.5 truncate font-display font-medium text-slate-900 ${areaAccent.presets.rowHoverText}`}
        >
          {changed ? (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${comparisonAccent.dot}`}
              title={status === 'added' ? 'Added vs unreleased' : 'Modified vs unreleased'}
            />
          ) : null}
          <span className="truncate" title={preset.name}>
            {preset.name}
          </span>
        </span>
        <span className="block truncate font-mono text-[11px] text-slate-400" title={preset.id}>
          {preset.id}
        </span>
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover/col:bg-rose-100 group-hover/col:text-rose-700"
          title="Open modal"
        >
          <ExpandIcon className="h-3 w-3" />
        </span>
      </Link>
    </th>
  )
}

function PresetValueCell({ preset, row }: { preset: DenormalizedPreset; row: Row }) {
  const cellLink = row.link?.(preset)
  const errorHighlighted = row.errorHighlight?.(preset)
  const infoHighlighted = !errorHighlighted && row.highlight?.(preset)
  const highlightClass = row.highlightClass ?? areaAccent.presets.highlight

  return (
    <td
      title={row.link ? undefined : row.title?.(preset)}
      className={cn(
        'overflow-hidden border-r border-b border-slate-100 align-top text-slate-700',
        row.mono && 'font-mono text-xs',
        row.link ? 'p-0' : 'px-3 py-1.5',
        errorHighlighted
          ? 'bg-red-50/70'
          : infoHighlighted
            ? highlightClass
            : !row.link && 'group-hover:bg-slate-50',
      )}
      style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, maxWidth: COLUMN_WIDTH }}
    >
      {row.link ? (
        cellLink ? (
          <Link
            to="/"
            search={cellLink.search as never}
            title={cellLink.title}
            className={cn(
              `group/ac relative flex h-full w-full items-center px-3 py-1.5 pr-8 transition ${areaAccent.presets.rowHover}`,
              errorHighlighted && 'bg-red-50/70',
            )}
          >
            <span className="block min-w-0 flex-1">{renderCellContent(row, preset)}</span>
            <span
              aria-hidden
              className={`absolute top-1/2 right-1 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-sm font-semibold group-hover/ac:flex ${areaAccent.presets.cardChevron}`}
            >
              ›
            </span>
          </Link>
        ) : (
          <span className={cn('block h-full px-3 py-1.5', errorHighlighted && 'bg-red-50/70')}>
            {renderCellContent(row, preset)}
          </span>
        )
      ) : (
        renderCellContent(row, preset)
      )}
    </td>
  )
}

export function PresetTable() {
  useIconRegistryEpoch()
  const { data } = useSchema()
  const { result: comparison } = useComparison()
  const result = usePresetSearch()
  const scrollRef = useRef<HTMLDivElement>(null)

  const iconCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of data?.presets ?? []) {
      if (p.icon) m.set(p.icon, (m.get(p.icon) ?? 0) + 1)
    }
    return m
  }, [data])

  const sections = useMemo<Section[]>(() => {
    const presets = result?.data.items ?? []
    const fields = data?.fields ?? {}
    const tagKeys = uniqueSorted(presets.flatMap((p) => Object.keys(p.tags ?? {})))
    const fieldIds = uniqueSorted(presets.flatMap((p) => [...p.fields, ...p.moreFields]))
    return [
      {
        title: 'Identity',
        rows: [
          { label: 'ID', mono: true, truncate: true, render: (p) => p.id, title: (p) => p.id },
          {
            label: 'Searchable',
            render: (p) =>
              p.searchable === false ? (
                <span
                  className={`font-semibold ${areaAccent.presets.pillText}`}
                  title="searchable: false"
                >
                  no
                </span>
              ) : (
                <span className="text-slate-500">yes</span>
              ),
          },
          {
            label: 'Template',
            render: (p) =>
              p.isTemplate ? (
                <span className="font-medium text-slate-600" title="Template preset">
                  yes
                </span>
              ) : (
                <span className="text-slate-500">no</span>
              ),
            highlight: (p) => p.isTemplate,
            highlightClass: 'bg-slate-100/80',
          },
          { label: 'Name', breakText: true, render: (p) => p.name, title: (p) => p.name },
          {
            label: 'Terms',
            breakText: true,
            render: (p) => (p.terms.length ? p.terms.join(', ') : dash),
            title: (p) => p.terms.join(', '),
          },
          {
            label: 'Aliases',
            breakText: true,
            render: (p) => (p.aliases.length ? p.aliases.join(', ') : dash),
            title: (p) => p.aliases.join(', '),
          },
          {
            label: 'Geometry',
            render: (p) => (p.geometry.length ? <GeometryIcons geometry={p.geometry} /> : dash),
            title: (p) => (p.geometry.length ? p.geometry.join(', ') : undefined),
          },
          {
            label: 'Category',
            truncate: true,
            render: (p) => (p.categoryNames.length ? p.categoryNames.join(', ') : dash),
            link: (p) =>
              p.categoryNames.length
                ? {
                    search: (prev) => ({
                      ...presetSearchDefaults,
                      dataUrl: prev.dataUrl ?? '',
                      locale: prev.locale ?? '',
                      categoryNames: p.categoryNames,
                    }),
                    title: 'Show all presets of this category',
                  }
                : null,
          },
          {
            label: 'Icon',
            render: (p) => {
              if (!p.icon) return dash
              return <IconNameCell iconName={p.icon} />
            },
            title: (p) => p.icon ?? undefined,
            highlight: (p) => isPresetIconCellBroken(p.icon),
            errorHighlight: (p) => isPresetIconCellBroken(p.icon),
            link: (p) =>
              p.icon && (iconCounts.get(p.icon) ?? 0) > 1
                ? {
                    search: (prev) => ({
                      ...presetSearchDefaults,
                      dataUrl: prev.dataUrl ?? '',
                      locale: prev.locale ?? '',
                      iconName: [p.icon as string],
                    }),
                    title: 'Show all presets of this icon',
                  }
                : null,
          },
          {
            label: <AreaLabel area="icons">Options icons</AreaLabel>,
            labelTitle: 'Icons used by field options on this preset',
            render: (p) => {
              const icons = getPresetOptionIconNames(p, fields)
              if (icons.length === 0) return dash
              return (
                <span className="flex flex-col gap-1">
                  {icons.map((iconName) => (
                    <IconNameCell key={iconName} iconName={iconName} />
                  ))}
                </span>
              )
            },
            highlight: (p) =>
              getPresetOptionIconNames(p, fields).some((icon) => isIconSvgConfirmedMissing(icon)),
            errorHighlight: (p) =>
              getPresetOptionIconNames(p, fields).some((icon) => isIconSvgConfirmedMissing(icon)),
          },
          {
            label: 'imageURL',
            mono: true,
            wrap: true,
            render: (p) => (p.imageURL ? p.imageURL : dash),
            title: (p) => p.imageURL,
          },
        ],
      },
      {
        title: `Tags (${tagKeys.length})`,
        rows: tagKeys.map((k) => ({
          label: k,
          mono: true,
          truncate: true,
          render: (p) => (p.tags && k in p.tags ? p.tags[k] : dash),
          title: (p) => (p.tags && k in p.tags ? `${k}=${p.tags[k]}` : undefined),
        })),
      },
      {
        title: `Fields (${fieldIds.length})`,
        area: 'fields',
        rows: fieldIds.map((f) => ({
          rowKey: f,
          label: (
            <AreaLink
              area="fields"
              to="/field/$"
              params={{ _splat: f }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
              className="font-mono text-xs no-underline hover:underline"
              title={`Open field "${f}"`}
            >
              {f}
            </AreaLink>
          ),
          mono: true,
          highlight: (p) => p.fields.includes(f) || p.moreFields.includes(f),
          title: (p) =>
            p.fields.includes(f)
              ? `Uses field "${f}"`
              : p.moreFields.includes(f)
                ? `Uses field "${f}" (secondary)`
                : `Does not use "${f}"`,
          render: (p) =>
            p.fields.includes(f) ? (
              <span className={`font-semibold ${areaAccent.fields.fieldMarker}`}>✓</span>
            ) : p.moreFields.includes(f) ? (
              <span className={areaAccent.fields.fieldMarkerSecondary}>○</span>
            ) : (
              dash
            ),
        })),
      },
    ]
  }, [result, iconCounts, data?.fields])

  const presets = result?.data.items ?? []
  const total = result?.data.total ?? 0
  const truncated = total > presets.length

  const columnVirtualizer = useVirtualizer({
    count: presets.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => COLUMN_WIDTH,
    horizontal: true,
    overscan: 3,
  })

  const virtualColumns = columnVirtualizer.getVirtualItems()
  const totalColumnWidth = columnVirtualizer.getTotalSize()
  const paddingLeft = virtualColumns[0]?.start ?? 0
  const paddingRight = totalColumnWidth - (virtualColumns.at(-1)?.end ?? 0)

  if (!result) return null

  if (presets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        No presets match. Try clearing filters or changing the search query.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {truncated ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Showing the first <strong>{presets.length}</strong> of <strong>{total}</strong> matching
          presets — add filters to narrow the comparison.
        </p>
      ) : null}
      <div
        ref={scrollRef}
        className="relative max-h-[calc(100svh-13rem)] overflow-auto rounded-xl border border-slate-200"
      >
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 border-r border-b border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-500">
                Property
              </th>
              <VirtualizedPresetColumns
                presets={presets}
                virtualColumns={virtualColumns}
                paddingLeft={paddingLeft}
                paddingRight={paddingRight}
                renderColumn={(preset) => {
                  const status = comparison?.presets.statusById.get(preset.id)
                  const changed = status === 'added' || status === 'modified'
                  return <PresetHeaderCell preset={preset} changed={changed} status={status} />
                }}
              />
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.title}>
                <tr>
                  <th className="sticky left-0 z-10 border-r border-b border-slate-200 bg-slate-100 px-3 py-1 text-left font-display text-xs font-medium tracking-wide text-slate-600">
                    {section.area ? (
                      <span className="inline-flex items-center gap-1.5">
                        <AreaIcon
                          area={section.area}
                          className={`h-3 w-3 shrink-0 ${areaAccent[section.area].icon}`}
                        />
                        {section.title}
                      </span>
                    ) : (
                      section.title
                    )}
                  </th>
                  <th
                    colSpan={
                      virtualColumns.length + (paddingLeft > 0 ? 1 : 0) + (paddingRight > 0 ? 1 : 0)
                    }
                    className="border-b border-slate-200 bg-slate-100 px-0 py-1"
                    style={{ width: totalColumnWidth, minWidth: totalColumnWidth }}
                  />
                </tr>
                {section.rows.map((row) => (
                  <tr
                    key={row.rowKey ?? (typeof row.label === 'string' ? row.label : section.title)}
                    className="group"
                  >
                    <th
                      title={row.labelTitle}
                      className={cn(
                        'sticky left-0 z-10 border-r border-b border-slate-200 bg-white px-3 py-1.5 text-left align-top font-normal text-slate-600 group-hover:bg-slate-50',
                        row.mono && 'font-mono text-xs',
                      )}
                    >
                      {row.label}
                    </th>
                    <VirtualizedPresetColumns
                      presets={presets}
                      virtualColumns={virtualColumns}
                      paddingLeft={paddingLeft}
                      paddingRight={paddingRight}
                      spacerAs="td"
                      renderColumn={(preset) => <PresetValueCell preset={preset} row={row} />}
                    />
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
