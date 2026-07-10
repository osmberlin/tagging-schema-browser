import { getIconSvgDataUrl } from '@/components/PageIcons/iconRegistry'
import { AreaIcon } from '@/components/ui/areaIcons'
import { areaAccent } from '@/theme/areaAccent'
import type { FieldOptionMismatchRow } from '@/utils/fieldOptions'
import { cn } from '@/utils/tw'

function SmallIcon({ icon, title }: { icon?: string; title: string }) {
  if (!icon) {
    return <span className="text-slate-300">—</span>
  }
  const src = getIconSvgDataUrl(icon)
  if (!src) {
    return <span className="font-mono text-[10px] text-slate-500">{icon}</span>
  }
  return <img src={src} alt="" className="h-5 w-5 shrink-0" title={`${title}: ${icon}`} />
}

export function FieldOptionIconsTable({
  rows,
  onOpenPreset,
}: {
  rows: FieldOptionMismatchRow[]
  onOpenPreset: (id: string) => void
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-slate-500">
        No field options with dedicated child presets.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            <th className="px-4 py-2">Option</th>
            <th className="px-4 py-2">Field icon</th>
            <th className="px-4 py-2">Parent preset</th>
            <th className="px-4 py-2">Child preset</th>
            <th className="px-4 py-2">Preset icon</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.parentPreset.id}-${row.optionValue}`}
              className={cn('border-b border-slate-100', row.iconMismatch && 'bg-amber-50/80')}
            >
              <td className="px-4 py-2">
                <p className="font-medium text-slate-900">{row.labelEn}</p>
                <p className="font-mono text-[11px] text-slate-500">{row.optionValue}</p>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <SmallIcon icon={row.optionIcon} title="Field option" />
                  {row.optionIcon ? (
                    <span className="font-mono text-[11px] text-slate-500">{row.optionIcon}</span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => onOpenPreset(row.parentPreset.id)}
                  className={`inline-flex items-center gap-1 text-xs font-medium hover:underline ${areaAccent.presets.link}`}
                >
                  <AreaIcon area="presets" className="h-3 w-3" />
                  {row.parentPreset.name}
                </button>
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => onOpenPreset(row.childPreset.id)}
                  className={`inline-flex items-center gap-1 text-xs font-medium hover:underline ${areaAccent.presets.link}`}
                >
                  <AreaIcon area="presets" className="h-3 w-3" />
                  {row.childPreset.name}
                </button>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <SmallIcon icon={row.childPreset.icon} title="Child preset" />
                  {row.childPreset.icon ? (
                    <span className="font-mono text-[11px] text-slate-500">
                      {row.childPreset.icon}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-2">
                {row.iconMismatch ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 ring-inset">
                    Mismatch
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100 ring-inset">
                    Match
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
