import { Link } from '@tanstack/react-router'
import { isIconSvgConfirmedMissing } from '@/components/PageIcons/iconRegistry'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { Tooltip } from '@/components/ui/Tooltip'
import { areaAccent } from '@/theme/areaAccent'
import type { DenormalizedPreset, OptionIconUsageRef } from '@/utils/types'

function formatOptionUsages(usages: OptionIconUsageRef[]): string {
  return usages
    .map((u) => `${u.fieldId}=${u.optionValue}`)
    .slice(0, 8)
    .join(', ')
}

const iconCardClass =
  'flex h-full min-h-36 flex-col rounded-xl border border-slate-200 bg-white p-2.5'

export function IconCard({
  iconName,
  svgRaw,
  presetUsageCount,
  optionUsageCount,
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
  const svgDataUrl = svgRaw ? `data:image/svg+xml;utf8,${encodeURIComponent(svgRaw)}` : null
  const missingSvg = !svgRaw && isIconSvgConfirmedMissing(iconName)
  const presetNames = presets.map((p) => p.name).join(', ')
  const optionSummary = formatOptionUsages(optionUsages)
  const isUsed = presetUsageCount > 0 || optionUsageCount > 0

  const body = (
    <>
      <div className="flex items-center gap-2.5">
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
      </div>
      <p
        className={`mt-2 truncate font-mono text-xs font-medium ${missingSvg ? 'text-red-700' : 'text-slate-900'}`}
        title={iconName}
      >
        {iconName}
      </p>
      {presetUsageCount > 0 ? (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <AreaIcon area="presets" className={`h-3 w-3 ${areaAccent.presets.icon}`} />
            Presets
          </span>{' '}
          <CountPill className="bg-slate-100 align-text-bottom">{presetUsageCount}</CountPill>:{' '}
          {presetNames}
        </p>
      ) : null}
      {optionUsageCount > 0 ? (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <AreaIcon area="fields" className={`h-3 w-3 ${areaAccent.fields.icon}`} />
            Options
          </span>{' '}
          <CountPill className="bg-slate-100 align-text-bottom">{optionUsageCount}</CountPill>:{' '}
          {optionSummary}
          {optionUsages.length > 8 ? '…' : ''}
        </p>
      ) : null}
      {!isUsed ? <p className="mt-1 text-xs text-slate-400">Unused</p> : null}
    </>
  )

  if (presetUsageCount > 0) {
    return (
      <Tooltip
        content={`Show all ${presetUsageCount} presets using "${iconName}"`}
        placement="top"
        wrapperClassName="block h-full"
      >
        <Link
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? '',
            locale: prev.locale ?? '',
            iconName: [iconName],
          })}
          data-icon={iconName}
          className={`group/ac relative block ${iconCardClass} transition duration-200 ${areaAccent.icons.cardHoverBorder} ${areaAccent.icons.cardHoverBg} hover:shadow-md hover:shadow-slate-900/5`}
        >
          {body}
          <span
            aria-hidden
            className={`absolute top-2 right-2 hidden h-5 w-5 items-center justify-center rounded-full text-sm font-semibold group-hover/ac:flex ${areaAccent.icons.cardChevron}`}
          >
            ›
          </span>
        </Link>
      </Tooltip>
    )
  }

  return (
    <article className={iconCardClass} data-icon={iconName}>
      {body}
    </article>
  )
}
