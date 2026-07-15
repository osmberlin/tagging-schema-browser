import { Link } from '@tanstack/react-router'
import { isIconSvgConfirmedMissing, useIconSvgDataUrl } from '@/components/PageIcons/iconRegistry'
import { iconFacetDefaults } from '@/components/PageIcons/useIconFacetState'
import type { FieldDiff } from '@/utils/presetDiff'

function IconDiffLink({ iconName, tone }: { iconName: string; tone: 'before' | 'after' }) {
  const src = useIconSvgDataUrl(iconName)
  const broken = !src && isIconSvgConfirmedMissing(iconName)
  const textClass =
    tone === 'before'
      ? 'font-mono text-xs text-rose-600 line-through hover:underline'
      : 'font-mono text-xs text-emerald-700 hover:text-emerald-800 hover:underline'

  return (
    <Link
      to="/icons"
      search={(prev) => ({
        ...iconFacetDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
        i_q: iconName,
        i_usage: 'all',
      })}
      className="inline-flex items-center gap-1.5"
      title={`Open icon “${iconName}”`}
    >
      {src ? (
        <img src={src} alt="" className="h-5 w-5 shrink-0 object-contain" />
      ) : broken ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-red-300 bg-red-50 text-[10px] font-semibold text-red-700"
          title="Missing icon asset"
        >
          !
        </span>
      ) : null}
      <span className={textClass}>{iconName}</span>
    </Link>
  )
}

function FieldDiffLink({ fieldId, tone }: { fieldId: string; tone: 'before' | 'after' }) {
  const textClass =
    tone === 'before'
      ? 'font-mono text-xs text-rose-600 line-through hover:underline'
      : 'font-mono text-xs text-emerald-700 hover:text-emerald-800 hover:underline'

  return (
    <Link
      to="/field/$"
      params={{ _splat: fieldId }}
      search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
      className={textClass}
      title={`Open field “${fieldId}”`}
    >
      {fieldId}
    </Link>
  )
}

function ListItemValue({
  item,
  tone,
  label,
}: {
  item: string
  tone: 'before' | 'after'
  label: string
}) {
  if (label === 'Fields' || label === 'More fields') {
    return <FieldDiffLink fieldId={item} tone={tone} />
  }
  const textClass =
    tone === 'before'
      ? 'font-mono text-xs text-rose-600 line-through'
      : 'font-mono text-xs text-emerald-700'
  return <span className={textClass}>{item}</span>
}

function ListDiffValue({ diff, arrowClass }: { diff: FieldDiff; arrowClass: string }) {
  const { removed, added, unchangedCount } = diff.listChanges!

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
      {removed.map((item, index) => (
        <span key={`removed-${item}`} className="inline-flex items-center">
          {index > 0 ? <span className="text-slate-300">, </span> : null}
          <ListItemValue item={item} tone="before" label={diff.label} />
        </span>
      ))}
      {removed.length > 0 && added.length > 0 ? (
        <span className={`mx-0.5 ${arrowClass}`}>→</span>
      ) : null}
      {added.map((item, index) => (
        <span key={`added-${item}`} className="inline-flex items-center">
          {index > 0 ? <span className="text-slate-300">, </span> : null}
          <ListItemValue item={item} tone="after" label={diff.label} />
        </span>
      ))}
      {unchangedCount > 0 ? (
        <span className="text-slate-400">
          ({unchangedCount} unchanged{unchangedCount === 1 ? '' : 's'})
        </span>
      ) : null}
    </span>
  )
}

function PlainDiffValue({ diff, arrowClass }: { diff: FieldDiff; arrowClass: string }) {
  return (
    <>
      <span className="text-rose-600 line-through">{diff.before || '—'}</span>
      <span className={`mx-1 ${arrowClass}`}>→</span>
      <span className="text-emerald-700">{diff.after || '—'}</span>
    </>
  )
}

export function FieldDiffValue({
  diff,
  arrowClass = 'text-slate-300',
}: {
  diff: FieldDiff
  arrowClass?: string
}) {
  if (diff.listChanges) {
    return <ListDiffValue diff={diff} arrowClass={arrowClass} />
  }

  if (diff.label !== 'Icon') {
    return <PlainDiffValue diff={diff} arrowClass={arrowClass} />
  }

  return (
    <>
      {diff.before ? (
        <IconDiffLink iconName={diff.before} tone="before" />
      ) : (
        <span className="text-rose-600 line-through">—</span>
      )}
      <span className={`mx-1 ${arrowClass}`}>→</span>
      {diff.after ? (
        <IconDiffLink iconName={diff.after} tone="after" />
      ) : (
        <span className="text-emerald-700">—</span>
      )}
    </>
  )
}
