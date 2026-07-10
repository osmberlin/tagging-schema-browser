import { Link } from '@tanstack/react-router'
import {
  getIconSvgDataUrl,
  isIconSvgConfirmedMissing,
  useIconRegistryEpoch,
} from '@/components/PageIcons/iconRegistry'
import { AreaIcon } from '@/components/ui/areaIcons'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import type { IconUsageRow } from './iconUsageRows'

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
        className={`inline-flex items-center gap-1.5 hover:underline ${areaAccent.presets.link}`}
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
        className={`inline-flex items-center gap-1.5 hover:underline ${areaAccent.fields.link}`}
        title={`Open field "${row.fieldId}"`}
      >
        <AreaIcon area="fields" className={`h-3.5 w-3.5 ${areaAccent.fields.icon}`} />
        <span className="truncate">{row.label}</span>
      </Link>
    )
  }

  return <span className="truncate text-slate-900">{row.label}</span>
}

export function IconUsageTable({ rows }: { rows: IconUsageRow[] }) {
  void useIconRegistryEpoch()

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-2.5 font-semibold">Icon</th>
            <th className="px-3 py-2.5 font-semibold">Label</th>
            <th className="px-3 py-2.5 font-semibold">Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.iconName}:${row.kind}:${row.code}`}
              data-icon-usage={row.iconName}
              className="border-b border-slate-100 last:border-b-0"
            >
              <td className="max-w-xs px-3 py-2 align-top">
                <IconNameCell iconName={row.iconName} />
              </td>
              <td className="max-w-md px-3 py-2 align-top text-slate-900">
                <UsageLabelLink row={row} />
              </td>
              <td className="px-3 py-2 align-top font-mono text-xs text-slate-600" title={row.code}>
                {row.code}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
