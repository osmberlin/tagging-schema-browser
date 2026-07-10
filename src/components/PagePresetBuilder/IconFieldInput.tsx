import { useEffect } from 'react'
import {
  areAllIconSuppliersLoaded,
  ensureAllIconSuppliers,
  ensureIconsForNames,
  getIconRegistry,
  iconSupplierFromName,
  isIconSvgConfirmedMissing,
  useIconSvgDataUrl,
} from '@/components/PageIcons/iconRegistry'
import { useIconSearch } from '@/components/PageIcons/useIconSearch'
import { useSchema } from '@/hooks/useSchema'
import { routerBasepath } from '@/utils/routerBasepath'

type IconFieldInputProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  dataUrl: string
}

export function useIconFieldValidation(iconName: string) {
  useEffect(() => {
    void ensureAllIconSuppliers()
    if (iconName.trim()) {
      void ensureIconsForNames([iconName.trim()])
    }
  }, [iconName])

  const allLoaded = areAllIconSuppliersLoaded()
  const trimmed = iconName.trim()
  const supplier = trimmed ? iconSupplierFromName(trimmed) : null
  const inRegistry = trimmed ? getIconRegistry().has(trimmed) : false
  const broken = trimmed ? isIconSvgConfirmedMissing(trimmed) : false

  let status: 'empty' | 'pending' | 'valid' | 'invalid' = 'empty'
  if (trimmed) {
    if (!supplier) {
      status = 'invalid'
    } else if (!allLoaded && !inRegistry) {
      status = 'pending'
    } else if (!inRegistry || broken) {
      status = 'invalid'
    } else {
      status = 'valid'
    }
  }

  return { status, supplier, allLoaded }
}

export function IconFieldInput({ value, onChange, onBlur, dataUrl }: IconFieldInputProps) {
  const { presets, fields, data } = useSchema()
  const { icons } = useIconSearch(presets, fields, data?.fieldTranslations)
  const { status } = useIconFieldValidation(value)
  const iconSrc = useIconSvgDataUrl(value.trim() || undefined)

  const usage = icons.find((icon) => icon.name === value.trim())
  const presetCount = usage?.presetUsageCount ?? 0
  const optionCount = usage?.optionUsageCount ?? 0
  const used = presetCount + optionCount > 0

  const iconsPageUrl = buildIconsPageUrl(value.trim(), dataUrl)

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="maki-cafe"
          className={`block w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:ring-2 focus:outline-none ${
            status === 'invalid'
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/30'
              : 'border-slate-300 focus:border-rose-500 focus:ring-rose-500/30'
          }`}
          spellCheck={false}
        />
        {iconSrc ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <img src={iconSrc} alt="" className="h-6 w-6 object-contain" />
          </div>
        ) : null}
      </div>

      <p className="text-sm text-slate-600">
        Find an icon name on the Icons page (search and facets), then paste it here.{' '}
        <a
          href={iconsPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-rose-600 hover:text-rose-700"
        >
          Open Icons page ↗
        </a>
      </p>

      {status === 'invalid' ? (
        <p className="text-sm text-red-700">Unknown icon name — not in the icon registry.</p>
      ) : null}
      {status === 'pending' ? (
        <p className="text-sm text-slate-500">Checking icon registry…</p>
      ) : null}
      {status === 'valid' && used ? (
        <p className="text-sm text-slate-600">
          Already used on {presetCount} preset{presetCount === 1 ? '' : 's'}
          {optionCount > 0 ? ` and ${optionCount} field option${optionCount === 1 ? '' : 's'}` : ''}
          .{' '}
          <a
            href={`${iconsPageUrl}${iconsPageUrl.includes('?') ? '&' : '?'}i_view=usages`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-rose-600 hover:text-rose-700"
          >
            View usages on Icons page ↗
          </a>
        </p>
      ) : null}
    </div>
  )
}

function buildIconsPageUrl(iconQuery: string, dataUrl: string): string {
  const base = routerBasepath().replace(/\/$/, '')
  const params = new URLSearchParams()
  if (dataUrl.trim()) params.set('dataUrl', dataUrl.trim())
  if (iconQuery) params.set('i_q', iconQuery)
  const query = params.toString()
  return `${base}/icons${query ? `?${query}` : ''}`
}
