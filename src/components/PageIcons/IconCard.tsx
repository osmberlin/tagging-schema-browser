import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { fieldFacetDefaults } from '@/components/PageFields/useFieldFacetState'
import {
  ensureIconSvg,
  getIconRegistry,
  getIconSvgDataUrl,
  isIconSvgConfirmedMissing,
  useIconRegistryEpoch,
} from '@/components/PageIcons/iconRegistry'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { Tooltip } from '@/components/ui/Tooltip'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset, OptionIconUsageRef } from '@/utils/types'

function formatOptionUsages(usages: OptionIconUsageRef[]): string {
  return usages
    .map((u) => `${u.fieldId}=${u.optionValue}`)
    .slice(0, 8)
    .join(', ')
}

const iconCardClass =
  'flex h-52 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white'

const footerSlotClass =
  'flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium'

const footerLinkClass =
  'transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset'

export function IconCard({
  iconName,
  svgRaw: svgRawProp,
  presetUsageCount,
  presets,
  optionUsages,
}: {
  iconName: string
  svgRaw?: string
  presetUsageCount: number
  optionUsageCount: number
  presets: DenormalizedPreset[]
  optionUsages: OptionIconUsageRef[]
}) {
  useIconRegistryEpoch()
  useEffect(() => {
    ensureIconSvg(iconName)
  }, [iconName])

  const svgRaw = svgRawProp ?? getIconRegistry().get(iconName)?.svgRaw
  const svgDataUrl =
    getIconSvgDataUrl(iconName) ??
    (svgRaw ? `data:image/svg+xml;utf8,${encodeURIComponent(svgRaw)}` : null)
  const missingSvg = !svgRaw && isIconSvgConfirmedMissing(iconName)
  const presetNames = presets.map((p) => p.name).join(', ')
  const optionSummary = formatOptionUsages(optionUsages)
  const fieldUsageCount = new Set(optionUsages.map((usage) => usage.fieldId)).size
  const optionUsageCount = optionUsages.length
  const isUsed = presetUsageCount > 0 || optionUsageCount > 0

  return (
    <article className={iconCardClass} data-icon={iconName}>
      <div className="flex min-w-0 flex-1 flex-col p-2.5 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip
            content={missingSvg ? 'Missing icon asset' : '60px reference size in the editor'}
            placement="top"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-slate-500 [&_svg]:h-8 [&_svg]:w-8 [&_svg]:fill-current ${
                missingSvg ? 'border border-red-300 bg-red-50 text-red-700' : 'bg-slate-100'
              }`}
            >
              {svgDataUrl ? (
                <img src={svgDataUrl} alt="" className="h-8 w-8 object-contain" />
              ) : missingSvg ? (
                <span className="text-sm font-bold">!</span>
              ) : (
                <span className="font-mono text-[10px]">60</span>
              )}
            </div>
          </Tooltip>
          <Tooltip content="12px reference size in the editor" placement="top">
            <div className="flex h-3 w-3 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:fill-current">
              {svgDataUrl ? (
                <img src={svgDataUrl} alt="" className="h-3 w-3 object-contain" />
              ) : (
                <span className="font-mono text-[6px]">12</span>
              )}
            </div>
          </Tooltip>
          <p
            className={`min-w-0 flex-1 truncate font-mono text-xs font-medium ${missingSvg ? 'text-red-700' : 'text-slate-900'}`}
            title={iconName}
          >
            {iconName}
          </p>
        </div>

        {presetUsageCount > 0 ? (
          <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-500" title={presetNames}>
            <AreaIcon
              area="presets"
              className={cn('mr-1 inline h-3 w-3 align-[-2px]', areaAccent.presets.icon)}
            />
            {presetNames}
          </p>
        ) : null}
        {optionUsageCount > 0 ? (
          <p
            className="mt-1.5 line-clamp-2 text-xs leading-snug text-slate-500"
            title={optionSummary}
          >
            <AreaIcon
              area="fields"
              className={cn('mr-1 inline h-3 w-3 align-[-2px]', areaAccent.fields.icon)}
            />
            {optionSummary}
            {optionUsages.length > 8 ? '…' : ''}
          </p>
        ) : null}
        {!isUsed ? <p className="mt-2 text-xs text-slate-400">Unused</p> : null}
      </div>

      {isUsed ? (
        <div className="mt-auto flex divide-x divide-slate-200">
          {presetUsageCount > 0 ? (
            <Link
              to="/"
              search={(prev) => ({
                ...presetSearchDefaults,
                dataUrl: prev.dataUrl ?? '',
                locale: prev.locale ?? '',
                iconName: [iconName],
              })}
              title={`Show all ${presetUsageCount} presets using "${iconName}"`}
              className={cn(
                footerSlotClass,
                footerLinkClass,
                'rounded-bl-xl text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-200',
              )}
            >
              <AreaIcon area="presets" className={`h-3.5 w-3.5 ${areaAccent.presets.icon}`} />
              Presets
              <CountPill className={`${areaAccent.presets.pill} ${areaAccent.presets.pillText}`}>
                {presetUsageCount}
              </CountPill>
            </Link>
          ) : (
            <span className={cn(footerSlotClass, 'rounded-bl-xl bg-slate-50/60')} aria-hidden />
          )}
          {fieldUsageCount > 0 ? (
            <Link
              to="/fields"
              search={(prev) => ({
                ...fieldFacetDefaults,
                dataUrl: prev.dataUrl ?? '',
                locale: prev.locale ?? '',
                f_optionIcon: iconName,
              })}
              title={`Show all ${fieldUsageCount} fields with options using "${iconName}"`}
              className={cn(
                footerSlotClass,
                footerLinkClass,
                'rounded-br-xl text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-200',
              )}
            >
              <AreaIcon area="fields" className={`h-3.5 w-3.5 ${areaAccent.fields.icon}`} />
              Fields
              <CountPill className={`${areaAccent.fields.pill} ${areaAccent.fields.pillText}`}>
                {fieldUsageCount}
              </CountPill>
            </Link>
          ) : (
            <span className={cn(footerSlotClass, 'rounded-br-xl bg-slate-50/60')} aria-hidden />
          )}
        </div>
      ) : null}
    </article>
  )
}
