import { Link } from '@tanstack/react-router'
import { isIconSvgConfirmedMissing, useIconSvgDataUrl } from '@/components/PageIcons/iconRegistry'
import { iconFacetDefaults } from '@/components/PageIcons/useIconFacetState'
import { presetIdFromRef } from '@/components/PagePresets/presetFieldInheritance'
import type { DiffEntry } from '@/utils/jsonDiff'

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

function PresetDiffLink({ presetId, tone }: { presetId: string; tone: 'before' | 'after' }) {
  const textClass =
    tone === 'before'
      ? 'font-mono text-xs text-rose-600 line-through hover:underline'
      : 'font-mono text-xs text-emerald-700 hover:text-emerald-800 hover:underline'

  return (
    <Link
      to="/preset/$"
      params={{ _splat: presetId }}
      search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
      className={textClass}
      title={`Open preset “${presetId}”`}
    >
      {presetId}
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
    const presetRef = presetIdFromRef(item)
    if (presetRef) {
      return <PresetDiffLink presetId={presetRef} tone={tone} />
    }
    return <FieldDiffLink fieldId={item} tone={tone} />
  }
  if (label === 'Members') {
    return <PresetDiffLink presetId={item} tone={tone} />
  }
  if (label === 'Options') {
    return <span className="font-mono text-xs text-slate-700">{item}</span>
  }
  const textClass =
    tone === 'before'
      ? 'font-mono text-xs text-rose-600 line-through'
      : 'font-mono text-xs text-emerald-700'
  return <span className={textClass}>{item}</span>
}

function UnorderedListDiffValue({ diff, arrowClass }: { diff: DiffEntry; arrowClass: string }) {
  const { removed, added, unchangedCount } = diff.listChanges!

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
      {removed.map((item, index) => (
        <span key={`removed-${index}`} className="inline-flex items-center">
          {index > 0 ? <span className="text-slate-300">, </span> : null}
          <ListItemValue item={item} tone="before" label={diff.label} />
        </span>
      ))}
      {removed.length > 0 && added.length > 0 ? (
        <span className={`mx-0.5 ${arrowClass}`}>→</span>
      ) : null}
      {added.map((item, index) => (
        <span key={`added-${index}`} className="inline-flex items-center">
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

function OrderedListDiffValue({ diff, arrowClass }: { diff: DiffEntry; arrowClass: string }) {
  const { removed, added, moved, unchangedCount } = diff.orderedListChanges!

  return (
    <span className="inline-flex flex-col gap-1">
      {(removed.length > 0 || added.length > 0) && (
        <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
          {removed.map((item, index) => (
            <span key={`removed-${index}`} className="inline-flex items-center">
              {index > 0 ? <span className="text-slate-300">, </span> : null}
              <ListItemValue item={item} tone="before" label={diff.label} />
            </span>
          ))}
          {removed.length > 0 && added.length > 0 ? (
            <span className={`mx-0.5 ${arrowClass}`}>→</span>
          ) : null}
          {added.map((item, index) => (
            <span key={`added-${index}`} className="inline-flex items-center">
              {index > 0 ? <span className="text-slate-300">, </span> : null}
              <ListItemValue item={item} tone="after" label={diff.label} />
            </span>
          ))}
        </span>
      )}
      {moved.length > 0 ? (
        <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-amber-700">
          {moved.map((move) => (
            <span
              key={`${move.item}-${move.fromIndex}-${move.toIndex}`}
              className="font-mono text-xs"
            >
              {move.item} #{move.fromIndex + 1}→#{move.toIndex + 1}
            </span>
          ))}
        </span>
      ) : null}
      {unchangedCount > 0 && (removed.length > 0 || added.length > 0 || moved.length > 0) ? (
        <span className="text-slate-400">
          ({unchangedCount} unchanged{unchangedCount === 1 ? '' : 's'})
        </span>
      ) : null}
    </span>
  )
}

function RecordDiffValue({ diff, arrowClass }: { diff: DiffEntry; arrowClass: string }) {
  const { removed, added, modified } = diff.recordChanges!

  return (
    <span className="inline-flex flex-col gap-1">
      {removed.map((key) => (
        <span key={`removed-${key}`} className="font-mono text-xs text-rose-600 line-through">
          −{key}
        </span>
      ))}
      {added.map((key) => (
        <span key={`added-${key}`} className="font-mono text-xs text-emerald-700">
          +{key}
        </span>
      ))}
      {modified.map((entry) => (
        <span
          key={entry.key}
          className="inline-flex flex-wrap items-center gap-x-1 font-mono text-xs"
        >
          <span className="text-slate-500">{entry.key}=</span>
          <span className="text-rose-600 line-through">{entry.before}</span>
          <span className={arrowClass}>→</span>
          <span className="text-emerald-700">{entry.after}</span>
        </span>
      ))}
    </span>
  )
}

function PlainDiffValue({ diff, arrowClass }: { diff: DiffEntry; arrowClass: string }) {
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
  diff: DiffEntry
  arrowClass?: string
}) {
  if (diff.kind === 'unordered-list' && diff.listChanges) {
    return <UnorderedListDiffValue diff={diff} arrowClass={arrowClass} />
  }

  if (diff.kind === 'ordered-list' && diff.orderedListChanges) {
    return <OrderedListDiffValue diff={diff} arrowClass={arrowClass} />
  }

  if (diff.kind === 'record' && diff.recordChanges) {
    return <RecordDiffValue diff={diff} arrowClass={arrowClass} />
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

/** @deprecated use DiffEntry */
export type { DiffEntry as FieldDiff } from '@/utils/jsonDiff'
