import { Link } from '@tanstack/react-router'
import { auditPageHref } from '@/components/PageAudits/auditPageHref'
import type {
  FieldListKey,
  MissingFieldInheritance,
  MissingInheritanceOverrideList,
  MissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'
import { resolveMissingInheritanceListStatus } from '@/components/PagePresets/missingFieldInheritance'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset } from '@/utils/types'

const STATUS_LABELS: Record<MissingInheritanceStatus, string> = {
  none: 'Inherits from slash parent',
  unreviewed: 'Missing parent fields (unreviewed)',
  intentional: 'Missing parent fields (intentional)',
  stale: 'Override snapshot stale',
}

const LIST_STATUS_LABELS: Record<MissingInheritanceStatus, string> = {
  none: 'Inherits from slash parent',
  unreviewed: 'Unreviewed',
  intentional: 'Intentional omission',
  stale: 'Override stale',
}

function FieldListSection({
  fieldListKey,
  section,
  listOverride,
  presetId,
  dataUrl,
}: {
  fieldListKey: FieldListKey
  section: NonNullable<MissingFieldInheritance[FieldListKey]>
  listOverride?: MissingInheritanceOverrideList
  presetId: string
  dataUrl: string
}) {
  const title = fieldListKey === 'fields' ? 'Primary fields' : 'More fields'
  const listStatus = resolveMissingInheritanceListStatus(section, listOverride)
  const entryId = `${presetId}:${fieldListKey}`
  return (
    <div className="space-y-2 text-sm text-slate-700">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{LIST_STATUS_LABELS[listStatus]}</span>
      </div>
      <p>
        Expected slash-parent source:{' '}
        <Link
          to="/preset/$"
          params={{ _splat: section.parentId }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          className="font-mono text-sky-700 underline underline-offset-2"
        >
          {section.parentId}
        </Link>
      </p>
      <p>Field ids not inherited from the parent list:</p>
      <ul className="list-inside list-disc font-mono text-sm">
        {section.missedFieldIds.map((fieldId) => (
          <li key={fieldId}>{fieldId}</li>
        ))}
      </ul>
      {section.explicitPresetRefs.length > 0 ? (
        <p className="text-slate-500">
          Other preset refs on this list: {section.explicitPresetRefs.join(', ')}
        </p>
      ) : null}
      {listStatus === 'unreviewed' || listStatus === 'stale' ? (
        <a
          href={auditPageHref({ slug: 'missing-inheritance', dataUrl, selected: entryId })}
          className={cn(
            'inline-flex text-sm font-medium underline underline-offset-2',
            areaAccent.fields.link,
          )}
        >
          Review on audit page →
        </a>
      ) : null}
    </div>
  )
}

export function MissingInheritancePanel({
  preset,
  dataUrl = '',
}: {
  preset: DenormalizedPreset
  dataUrl?: string
}) {
  const { missingFieldInheritance, missingInheritanceStatus } = preset

  if (missingInheritanceStatus === 'none') return null

  const parentId =
    missingFieldInheritance?.fields?.parentId ?? missingFieldInheritance?.moreFields?.parentId

  const needsAudit =
    missingInheritanceStatus === 'unreviewed' || missingInheritanceStatus === 'stale'

  return (
    <section
      data-testid="missing-inheritance-panel"
      className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-amber-950">Missing inheritance</h2>
          <p className="mt-1 text-sm text-amber-900/80">
            {STATUS_LABELS[missingInheritanceStatus]}
          </p>
        </div>
        {needsAudit ? (
          <a
            href={auditPageHref({ slug: 'missing-inheritance', dataUrl, selected: preset.id })}
            className={cn(
              'inline-flex shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-amber-900 ring-1 ring-amber-200 ring-inset hover:bg-amber-100',
            )}
          >
            Open audit →
          </a>
        ) : null}
      </div>
      <div className="mt-4 space-y-4">
        {missingFieldInheritance && parentId ? (
          <p className="text-sm text-slate-700">
            This preset defines an explicit field list without <code>{`{${parentId}}`}</code>, so it
            does not inherit every field from its slash parent.
          </p>
        ) : missingInheritanceStatus === 'stale' ? (
          <p className="text-sm text-slate-700">
            This preset no longer has missing slash-parent field inheritance, but a reviewed
            override entry still exists.
          </p>
        ) : null}
        {missingFieldInheritance?.fields ? (
          <FieldListSection
            fieldListKey="fields"
            section={missingFieldInheritance.fields}
            presetId={preset.id}
            dataUrl={dataUrl}
          />
        ) : null}
        {missingFieldInheritance?.moreFields ? (
          <FieldListSection
            fieldListKey="moreFields"
            section={missingFieldInheritance.moreFields}
            presetId={preset.id}
            dataUrl={dataUrl}
          />
        ) : null}
      </div>
    </section>
  )
}
