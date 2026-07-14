import { Link } from '@tanstack/react-router'
import { type ReactNode } from 'react'
import { type SearchState, presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import type { SchemaArea } from '@/components/ui/areaIcons'
import { AreaIcon } from '@/components/ui/areaIcons'
import { AreaLink } from '@/components/ui/AreaLink'
import { CountPill } from '@/components/ui/CountPill'
import { areaAccent, areaChipLinkClass } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'

type RelatedItem = { id: string; name: string }

type RelatedBlockProps = {
  title: ReactNode
  count: number
  area?: SchemaArea
  titleFilter: Partial<SearchState>
  presets: RelatedItem[]
  className?: string
}

export function RelatedBlock({
  title,
  count,
  area = 'presets',
  titleFilter,
  presets,
  className,
}: RelatedBlockProps) {
  return (
    <section className={cn('min-w-0 space-y-3', className)}>
      <h2 className="flex items-start justify-between gap-2 text-sm font-semibold text-slate-900">
        <AreaLink
          area={area}
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? '',
            locale: prev.locale ?? '',
            ...titleFilter,
            page: 1,
          })}
          className="min-w-0 text-left"
        >
          {title}
        </AreaLink>
        <CountPill>{count}</CountPill>
      </h2>
      {presets.length === 0 ? (
        <p className="text-sm text-slate-500">No related presets.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {presets.slice(0, 30).map((p) => (
            <Link
              key={p.id}
              to="/preset/$"
              params={{ _splat: p.id }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
              title={p.id}
              className={cn(
                'inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 text-xs font-medium',
                areaChipLinkClass('presets'),
              )}
            >
              <AreaIcon
                area="presets"
                className={cn('h-3 w-3 shrink-0', areaAccent.presets.icon)}
              />
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
          {presets.length > 30 ? (
            <span className="self-center text-xs text-slate-400">+{presets.length - 30} more</span>
          ) : null}
        </div>
      )}
    </section>
  )
}
