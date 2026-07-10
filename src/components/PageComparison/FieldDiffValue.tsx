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
