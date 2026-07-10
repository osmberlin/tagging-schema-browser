import { getIconSvgDataUrl } from '@/components/PageIcons/iconRegistry'
import { AreaIcon } from '@/components/ui/areaIcons'
import { areaAccent } from '@/theme/areaAccent'
import { schemaIssueStyles } from '@/theme/schemaIssue'
import type { FieldOptionMismatchRow } from '@/utils/fieldOptions'
import { cn } from '@/utils/tw'

function SmallIcon({ icon, title, dark }: { icon?: string; title: string; dark?: boolean }) {
  if (!icon) {
    return <span className={dark ? 'text-slate-500' : 'text-slate-300'}>—</span>
  }
  const src = getIconSvgDataUrl(icon)
  if (!src) {
    return (
      <span className={cn('font-mono text-[10px]', dark ? 'text-slate-400' : 'text-slate-500')}>
        {icon}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className={cn(
        'h-5 w-5 shrink-0 object-contain',
        dark && 'rounded border border-slate-200 bg-white p-0.5',
      )}
      title={`${title}: ${icon}`}
    />
  )
}

export function FieldOptionIconsTable({
  rows,
  onOpenPreset,
  variant = 'default',
}: {
  rows: FieldOptionMismatchRow[]
  onOpenPreset: (id: string) => void
  variant?: 'default' | 'inset'
}) {
  const dark = variant === 'inset'

  if (rows.length === 0) {
    return (
      <p className={cn('px-4 py-3 text-sm', dark ? 'text-slate-400' : 'text-slate-500')}>
        No field options with dedicated child presets.
      </p>
    )
  }

  const presetLinkClass = dark
    ? cn(schemaIssueStyles.disclosureActionLink, schemaIssueStyles.disclosurePresetLink)
    : `inline-flex items-center gap-1 text-sm font-medium hover:underline ${areaAccent.presets.link}`

  return (
    <div className={cn('not-prose overflow-x-auto', dark && schemaIssueStyles.disclosureBodyInset)}>
      <table className="min-w-full text-sm">
        <thead>
          <tr
            className={cn(
              'text-left text-xs font-semibold tracking-wide uppercase',
              dark
                ? 'border-b border-slate-600 bg-slate-950 text-slate-300'
                : 'border-b border-slate-200 bg-slate-50 text-slate-500',
            )}
          >
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
              className={cn(
                dark ? 'border-b border-slate-700' : 'border-b border-slate-100',
                row.iconMismatch && (dark ? 'bg-amber-950/40' : 'bg-amber-50/80'),
              )}
            >
              <td className="px-4 py-2">
                <p className={cn('font-medium', dark ? 'text-slate-100' : 'text-slate-900')}>
                  {row.labelEn}
                </p>
                <p className={cn('font-mono text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>
                  {row.optionValue}
                </p>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <SmallIcon icon={row.optionIcon} title="Field option" dark={dark} />
                  {row.optionIcon ? (
                    <span
                      className={cn(
                        'font-mono text-xs',
                        dark ? 'text-slate-400' : 'text-slate-500',
                      )}
                    >
                      {row.optionIcon}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => onOpenPreset(row.parentPreset.id)}
                  className={presetLinkClass}
                >
                  <AreaIcon area="presets" className="h-3 w-3" />
                  {row.parentPreset.name}
                </button>
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => onOpenPreset(row.childPreset.id)}
                  className={presetLinkClass}
                >
                  <AreaIcon area="presets" className="h-3 w-3" />
                  {row.childPreset.name}
                </button>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <SmallIcon icon={row.childPreset.icon} title="Child preset" dark={dark} />
                  {row.childPreset.icon ? (
                    <span
                      className={cn(
                        'font-mono text-xs',
                        dark ? 'text-slate-400' : 'text-slate-500',
                      )}
                    >
                      {row.childPreset.icon}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-2">
                {row.iconMismatch ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                      dark
                        ? 'bg-amber-900/60 text-amber-200 ring-amber-700/60'
                        : 'bg-amber-100 text-amber-800 ring-amber-200',
                    )}
                  >
                    Mismatch
                  </span>
                ) : (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                      dark
                        ? 'bg-emerald-900/50 text-emerald-200 ring-emerald-700/50'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-100',
                    )}
                  >
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
