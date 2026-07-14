import { Link } from '@tanstack/react-router'
import {
  getIconSvgDataUrl,
  isIconSvgConfirmedMissing,
  useIconRegistryEpoch,
} from '@/components/PageIcons/iconRegistry'
import { AreaIcon } from '@/components/ui/areaIcons'
import { VirtualizedWindowList } from '@/components/ui/VirtualizedWindowList'
import { areaAccent, areaLinkClass } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import type { IconUsageRow } from './iconUsageRows'

const USAGE_ROW_HEIGHT = 48

function IconNameCell({ iconName }: { iconName: string }) {
  const src = getIconSvgDataUrl(iconName)
  const broken = !src && isIconSvgConfirmedMissing(iconName)

  return (
    <span className="flex min-w-0 items-center gap-2">
      {src ? (
        <img src={src} alt="" className="h-5 w-5 shrink-0 object-contain" />
      ) : broken ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-red-300 bg-red-50 text-[10px] font-semibold text-red-700"
          title="Missing icon asset"
        >
          !
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 font-mono text-[9px] text-slate-400">
          ·
        </span>
      )}
      <span
        className={cn(
          'min-w-0 truncate font-mono text-xs',
          broken ? 'font-medium text-red-700' : 'text-slate-900',
        )}
        title={iconName}
      >
        {iconName}
      </span>
    </span>
  )
}

function UsageLabelLink({ row }: { row: IconUsageRow }) {
  if (row.kind === 'preset' && row.presetId) {
    return (
      <Link
        to="/preset/$"
        params={{ _splat: row.presetId }}
        search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
        className={cn('inline-flex items-center gap-1.5', areaLinkClass('presets'))}
        title={`Open preset "${row.presetId}"`}
      >
        <AreaIcon area="presets" className={`h-3.5 w-3.5 ${areaAccent.presets.icon}`} />
        <span className="truncate">{row.label}</span>
      </Link>
    )
  }

  if (row.kind === 'option' && row.fieldId) {
    return (
      <Link
        to="/field/$"
        params={{ _splat: row.fieldId }}
        search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
        className={cn('inline-flex items-center gap-1.5', areaLinkClass('fields'))}
        title={`Open field "${row.fieldId}"`}
      >
        <AreaIcon area="fields" className={`h-3.5 w-3.5 ${areaAccent.fields.icon}`} />
        <span className="truncate">{row.label}</span>
      </Link>
    )
  }

  return <span className="truncate text-slate-900">{row.label}</span>
}

function UsageTableRow({ row }: { row: IconUsageRow }) {
  return (
    <div
      data-icon-usage={row.iconName}
      className="grid min-h-12 grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] items-start gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0"
    >
      <div className="max-w-xs min-w-0">
        <IconNameCell iconName={row.iconName} />
      </div>
      <div className="max-w-md min-w-0 text-slate-900">
        <UsageLabelLink row={row} />
      </div>
      <div className="font-mono text-xs text-slate-600" title={row.code}>
        {row.code}
      </div>
    </div>
  )
}

export function IconUsageTable({ rows, busy = false }: { rows: IconUsageRow[]; busy?: boolean }) {
  void useIconRegistryEpoch()

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-left text-sm">
      <div
        role="row"
        className="grid grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        <div role="columnheader">Icon</div>
        <div role="columnheader">Label</div>
        <div role="columnheader">Code</div>
      </div>
      <VirtualizedWindowList
        items={rows}
        estimateSize={USAGE_ROW_HEIGHT}
        busy={busy}
        getKey={(row) => `${row.iconName}:${row.kind}:${row.code}`}
        renderItem={(row) => <UsageTableRow row={row} />}
      />
    </div>
  )
}
