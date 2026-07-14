import { Link } from '@tanstack/react-router'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { ExpandIcon } from '@/components/ui/ExpandIcon'
import { areaAccent, areaLinkClass } from '@/theme/areaAccent'
import { fieldTypeHint } from '@/utils/fieldTypes'
import { cn } from '@/utils/tw'
import type { FieldViewModel } from '@/utils/types'

const fieldCardClass =
  'group/fc relative flex flex-col rounded-xl border border-slate-200 bg-white p-2.5 transition duration-200 hover:shadow-md hover:shadow-slate-900/5'

export function FieldCard({ field }: { field: FieldViewModel }) {
  const names = field.presets.map((p) => p.name).join(', ')

  const body = (
    <div className="pointer-events-none flex flex-col">
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${areaAccent.fields.iconBg}`}
        >
          <AreaIcon area="fields" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900" title={field.label}>
            {field.label}
          </p>
          <p className="truncate font-mono text-xs text-slate-500" title={field.id}>
            {field.id}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-500">
        <span
          className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600"
          title={fieldTypeHint(field.type)}
        >
          {field.type}
        </span>
        {field.key !== field.id ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
            key={field.key}
          </span>
        ) : null}
        {field.universal ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
            universal
          </span>
        ) : null}
        {field.iconMismatchCount > 0 ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 ring-inset">
            {field.iconMismatchCount} icon mismatch{field.iconMismatchCount === 1 ? '' : 'es'}
          </span>
        ) : null}
      </div>
      {field.usageCount > 0 ? (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <AreaIcon area="presets" className={`h-3 w-3 ${areaAccent.presets.icon}`} />
            Presets
          </span>{' '}
          <CountPill className="bg-slate-100 align-text-bottom">{field.usageCount}</CountPill>:{' '}
          {names}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Unused by presets</p>
      )}
    </div>
  )

  return (
    <article
      data-field={field.id}
      className={`${fieldCardClass} ${areaAccent.fields.cardHoverBorder} ${areaAccent.fields.cardHoverBg}`}
    >
      <Link
        to="/field/$"
        params={{ _splat: field.id }}
        search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
        title={`Open field "${field.id}"`}
        className="absolute inset-0 rounded-xl"
        aria-label={`Open field "${field.label}"`}
      />
      {body}
      {field.usageCount > 0 ? (
        <Link
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? '',
            locale: prev.locale ?? '',
            fieldIds: [field.id],
          })}
          title={`Show all ${field.usageCount} presets using "${field.id}"`}
          className={cn(
            'relative z-10 mt-2 inline-flex items-center gap-1 self-start text-[11px]',
            areaLinkClass('presets'),
          )}
        >
          <AreaIcon area="presets" className={`h-3 w-3 ${areaAccent.presets.icon}`} />
          Filter presets
        </Link>
      ) : null}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-2 right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover/fc:flex ${areaAccent.fields.cardExpandHover}`}
      >
        <ExpandIcon className="h-3 w-3" />
      </span>
    </article>
  )
}
