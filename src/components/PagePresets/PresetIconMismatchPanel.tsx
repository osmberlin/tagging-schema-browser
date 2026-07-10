import { Link } from '@tanstack/react-router'
import { isIconSvgConfirmedMissing, useIconSvgDataUrl } from '@/components/PageIcons/iconRegistry'
import { iconFacetDefaults } from '@/components/PageIcons/useIconFacetState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { AreaLink } from '@/components/ui/AreaLink'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
import { areaAccent } from '@/theme/areaAccent'
import { schemaIssueStyles } from '@/theme/schemaIssue'
import type { PresetFieldSection, PresetOptionRow } from '@/utils/fieldOptions'
import {
  getChildPresetIconMismatchRefs,
  getParentPresetIconMismatchRows,
  type PresetIconMismatchRef,
} from '@/utils/iconMismatch'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset, FieldTranslations, RawFields } from '@/utils/types'

function MismatchIcon({
  icon,
  title,
  className,
}: {
  icon?: string
  title: string
  className?: string
}) {
  const src = useIconSvgDataUrl(icon)
  const broken = Boolean(icon && !src && isIconSvgConfirmedMissing(icon))

  if (!icon) {
    return (
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-300',
          className,
        )}
        title={`${title}: no icon`}
      >
        —
      </span>
    )
  }

  if (broken) {
    return (
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded border border-red-300 bg-red-50 text-xs font-semibold text-red-700',
          className,
        )}
        title={`${title}: missing icon ${icon}`}
      >
        !
      </span>
    )
  }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          'h-8 w-8 shrink-0 rounded border border-slate-200 bg-white object-contain p-1',
          className,
        )}
        title={`${title}: ${icon}`}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-200 bg-white px-0.5 text-center font-mono text-[9px] leading-tight text-slate-500',
        className,
      )}
      title={`${title}: ${icon}`}
    >
      {icon.slice(0, 8)}
    </span>
  )
}

function IconPageLink({ iconName, children }: { iconName: string; children: React.ReactNode }) {
  return (
    <AreaLink
      area="icons"
      to="/icons"
      search={(prev) => ({
        ...iconFacetDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
        i_q: iconName,
        i_usage: 'all',
      })}
      title={`Open icon “${iconName}” on Icons page`}
    >
      {children}
    </AreaLink>
  )
}

function MismatchRowPanel({
  section,
  row,
  perspective,
  parent,
}: {
  section: PresetFieldSection
  row: PresetOptionRow
  perspective: 'parent' | 'child'
  parent?: DenormalizedPreset
}) {
  const childIcon = row.childPreset?.icon
  const childPresetId = row.childPreset?.id

  return (
    <div className={cn('space-y-3 px-3 py-3', schemaIssueStyles.disclosureBodyInset)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <MismatchIcon icon={row.icon} title="Field option icon" />
          <span className="text-sm font-medium text-amber-300" aria-hidden>
            ≠
          </span>
          <MismatchIcon icon={childIcon} title="Child preset icon" />
        </div>
        <div className="min-w-0 text-sm text-slate-100">
          <p className="font-medium">Field option icon differs from child preset icon</p>
          <p className="mt-0.5 text-xs text-slate-300">
            Option <span className="font-mono">{row.optionValue}</span>
            {row.icon ? (
              <>
                {' '}
                uses <span className="font-mono">{row.icon}</span>
              </>
            ) : null}
            {childIcon ? (
              <>
                {' '}
                but child preset uses <span className="font-mono">{childIcon}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <dl className="grid gap-1 text-xs text-slate-200 sm:grid-cols-[5rem_1fr]">
        <dt className="font-medium text-slate-400">Field</dt>
        <dd className="font-mono">
          {section.fieldId}
          <span className="text-slate-400"> ({section.fieldKey})</span>
        </dd>
        <dt className="font-medium text-slate-400">Option</dt>
        <dd>
          {row.labelEn}
          <span className="font-mono text-slate-400"> · {row.optionValue}</span>
        </dd>
        {perspective === 'child' && parent ? (
          <>
            <dt className="font-medium text-slate-400">Parent</dt>
            <dd>{parent.name}</dd>
          </>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-2">
        <AreaLink
          area="fields"
          to="/field/$"
          params={{ _splat: section.fieldId }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          title={`Open field “${section.fieldId}”`}
        >
          Field
        </AreaLink>
        {row.icon ? <IconPageLink iconName={row.icon}>Option icon</IconPageLink> : null}
        {childIcon ? <IconPageLink iconName={childIcon}>Preset icon</IconPageLink> : null}
        {perspective === 'parent' && childPresetId ? (
          <Link
            to="/preset/$"
            params={{ _splat: childPresetId }}
            search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
            className={`inline-flex items-center gap-1.5 text-xs font-medium hover:underline ${areaAccent.presets.link}`}
          >
            <AreaIcon area="presets" className="h-3.5 w-3.5" />
            Child preset
          </Link>
        ) : null}
        {perspective === 'child' && parent ? (
          <Link
            to="/preset/$"
            params={{ _splat: parent.id }}
            search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
            className={`inline-flex items-center gap-1.5 text-xs font-medium hover:underline ${areaAccent.presets.link}`}
          >
            <AreaIcon area="presets" className="h-3.5 w-3.5" />
            Parent preset
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function ChildMismatchBlock({ mismatch }: { mismatch: PresetIconMismatchRef }) {
  return (
    <MismatchRowPanel
      section={mismatch.section}
      row={mismatch.row}
      perspective="child"
      parent={mismatch.parent}
    />
  )
}

export function PresetIconMismatchPanel({
  preset,
  presets,
  fields,
  fieldTranslations,
}: {
  preset: DenormalizedPreset
  presets: DenormalizedPreset[]
  fields: RawFields
  fieldTranslations: FieldTranslations
}) {
  const parentRows = getParentPresetIconMismatchRows(preset, fields, fieldTranslations, presets)
  const childRefs = getChildPresetIconMismatchRefs(preset.id, fields, fieldTranslations, presets)
  const disclosureId = `preset-icon-mismatch:${preset.id}`
  useAutoOpenFocusedIssue(
    disclosureId,
    'iconMismatch',
    parentRows.length > 0 || childRefs.length > 0,
  )

  if (parentRows.length === 0 && childRefs.length === 0) return null

  const mismatchCount = parentRows.length + childRefs.length

  const summary =
    childRefs.length > 0 && parentRows.length === 0
      ? 'Field option icon differs from this preset icon'
      : `${mismatchCount} field option${mismatchCount === 1 ? '' : 's'} with mismatched icons`

  return (
    <SchemaIssueDisclosure
      disclosureId={disclosureId}
      variant="warning"
      title="Icon mismatch"
      summary={summary}
      bodyClassName="not-prose space-y-3"
    >
      {childRefs.length > 0 ? (
        <div className="space-y-3">
          <p className="font-medium text-slate-100">
            This preset&apos;s icon is referenced by a parent field option that uses a different
            icon.
          </p>
          {childRefs.map((mismatch) => (
            <ChildMismatchBlock
              key={`${mismatch.parent.id}-${mismatch.row.optionValue}`}
              mismatch={mismatch}
            />
          ))}
        </div>
      ) : null}

      {parentRows.length > 0 ? (
        <div className="space-y-3">
          <p className="font-medium text-slate-100">
            {parentRows.length} field option{parentRows.length === 1 ? '' : 's'} on this preset use
            a different icon than the linked child preset{parentRows.length === 1 ? '' : 's'}.
          </p>
          {parentRows.map(({ section, row }) => (
            <MismatchRowPanel
              key={`${section.fieldId}-${row.optionValue}`}
              section={section}
              row={row}
              perspective="parent"
            />
          ))}
        </div>
      ) : null}
    </SchemaIssueDisclosure>
  )
}
