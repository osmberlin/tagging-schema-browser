import { Link } from '@tanstack/react-router'
import { useIconSvgDataUrl } from '@/components/PageIcons/iconRegistry'
import { AreaIcon } from '@/components/ui/areaIcons'
import { areaAccent } from '@/theme/areaAccent'
import type { PresetOptionRow } from '@/utils/fieldOptions'
import { fieldOptionTitle, type FieldOptionTranslation } from '@/utils/fieldOptionTranslation'
import { cn } from '@/utils/tw'

function OptionLabelRow({
  english,
  localized,
  showLocale,
}: {
  english: string
  localized?: string
  showLocale: boolean
}) {
  if (!showLocale) {
    return <p className="text-sm text-slate-900">{english}</p>
  }
  const same = Boolean(localized && localized === english)
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-2">
      <span className="text-slate-900">{english}</span>
      <span
        className={cn('text-slate-900', same && 'text-yellow-700')}
        title={same ? 'Same as English' : undefined}
      >
        {localized ?? <span className="text-slate-400">—</span>}
      </span>
    </div>
  )
}

function OptionIcon({
  icon,
  iconBroken,
  label,
}: {
  icon?: string
  iconBroken: boolean
  label: string
}) {
  const iconSrc = useIconSvgDataUrl(icon)
  if (!icon) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-300"
        title={`${label}: no icon`}
      >
        —
      </span>
    )
  }
  if (iconBroken) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-red-300 bg-red-50 text-[10px] font-semibold text-red-700"
        title={`${label}: missing icon ${icon}`}
      >
        !
      </span>
    )
  }
  return (
    <img
      src={iconSrc ?? undefined}
      alt=""
      className="h-5 w-5 shrink-0 object-contain"
      title={`${label}: ${icon}`}
    />
  )
}

export function FieldOptionsPreview({
  options,
  locale,
  fieldLocaleMap,
}: {
  options: PresetOptionRow[]
  locale?: string
  fieldLocaleMap?: Record<string, { options?: Record<string, FieldOptionTranslation> }> | null
}) {
  const showLocale = Boolean(locale)
  if (options.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
        Options
        {showLocale ? (
          <span className="ml-2 font-normal text-slate-400 normal-case">
            EN ↔ <span className="font-mono">{locale}</span>
          </span>
        ) : null}
      </div>
      {options.map((row) => {
        const labelLocale = fieldOptionTitle(
          fieldLocaleMap?.[row.fieldId]?.options?.[row.optionValue],
        )
        const childPreset = row.childPreset
        return (
          <div
            key={row.optionValue}
            className={cn(
              'flex items-start gap-3 border-t border-slate-100 px-3 py-2 first:border-t-0',
              row.iconMismatch && 'bg-amber-50/80',
            )}
          >
            <div className="flex shrink-0 items-center gap-1.5">
              <OptionIcon icon={row.icon} iconBroken={row.iconBroken} label="Option icon" />
              {row.iconMismatch && childPreset?.icon ? (
                <>
                  <span className="text-[10px] text-amber-600" aria-hidden>
                    ≠
                  </span>
                  <OptionIcon icon={childPreset.icon} iconBroken={false} label="Child preset" />
                </>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 font-sans">
              <p className="font-mono text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">{row.optionValue}</span>
                {row.icon ? (
                  <span className="ml-2 text-slate-400" title="Option icon">
                    {row.icon}
                  </span>
                ) : null}
                {row.iconMismatch && childPreset?.icon ? (
                  <span className="ml-2 text-amber-700" title="Child preset icon">
                    preset: {childPreset.icon}
                  </span>
                ) : null}
              </p>
              {row.iconMismatch ? (
                <p className="mt-0.5 text-[11px] font-medium text-amber-800">
                  Icon mismatch between field option and child preset
                </p>
              ) : null}
              <OptionLabelRow
                english={row.labelEn}
                localized={labelLocale}
                showLocale={showLocale}
              />
              {childPreset ? (
                <Link
                  to="/preset/$"
                  params={{ _splat: childPreset.id }}
                  search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline ${areaAccent.presets.link}`}
                >
                  <AreaIcon area="presets" className="h-3 w-3" />
                  {childPreset.name}
                </Link>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
