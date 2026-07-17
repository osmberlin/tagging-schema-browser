import { Link, useLocation } from '@tanstack/react-router'
import type {
  FieldListKey,
  MissingFieldInheritance,
  MissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { missingInheritanceOverrides } from '@/data/missingInheritanceOverrides'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
import { externalActionPillClass } from '@/theme/externalAccent'
import type { SchemaIssueVariant } from '@/theme/schemaIssue'
import { buildMissingInheritanceOverrideIssueUrl } from '@/utils/buildSchemaOverrideIssueUrl'
import type { DenormalizedPreset } from '@/utils/types'

const STATUS_LABELS: Record<MissingInheritanceStatus, string> = {
  none: 'Inherits from slash parent',
  unreviewed: 'Missing parent fields (unreviewed)',
  intentional: 'Missing parent fields (intentional)',
  stale: 'Override snapshot stale',
}

const ISSUE_TITLES: Record<Exclude<MissingInheritanceStatus, 'none'>, string> = {
  unreviewed: 'Missing inheritance',
  intentional: 'Intentional omission',
  stale: 'Stale override',
}

const ISSUE_VARIANTS: Record<Exclude<MissingInheritanceStatus, 'none'>, SchemaIssueVariant> = {
  unreviewed: 'warning',
  intentional: 'warning',
  stale: 'error',
}

function FieldListSection({
  fieldListKey,
  section,
}: {
  fieldListKey: FieldListKey
  section: NonNullable<MissingFieldInheritance[FieldListKey]>
}) {
  const title = fieldListKey === 'fields' ? 'Primary fields' : 'More fields'
  return (
    <div className="not-prose space-y-2">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-300">
        Expected slash-parent source:{' '}
        <Link
          to="/preset/$"
          params={{ _splat: section.parentId }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          className="font-mono text-sm text-sky-300 underline underline-offset-2"
        >
          {section.parentId}
        </Link>
      </p>
      <p className="text-sm text-slate-300">Field ids not inherited from the parent list:</p>
      <ul className="list-inside list-disc font-mono text-sm text-slate-100">
        {section.missedFieldIds.map((fieldId) => (
          <li key={fieldId}>{fieldId}</li>
        ))}
      </ul>
      {section.explicitPresetRefs.length > 0 ? (
        <p className="text-sm text-slate-400">
          Other preset refs on this list: {section.explicitPresetRefs.join(', ')}
        </p>
      ) : null}
    </div>
  )
}

function CreateIssueAction({
  presetId,
  missingFieldInheritance,
  dataUrl,
  pageUrl,
  includeStaleOverride,
}: {
  presetId: string
  missingFieldInheritance: MissingFieldInheritance
  dataUrl: string
  pageUrl: string
  includeStaleOverride: boolean
}) {
  const issueUrl = buildMissingInheritanceOverrideIssueUrl({
    presetId,
    missingFieldInheritance,
    pageUrl,
    dataUrl,
    existingOverride: includeStaleOverride
      ? missingInheritanceOverrides.presets[presetId]
      : undefined,
  })

  return (
    <div className="not-prose mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={externalActionPillClass('border border-mauve-200 bg-mauve-50/80')}
        data-testid="missing-inheritance-create-issue"
      >
        Create GitHub issue ↗
      </a>
      <p className="text-sm text-slate-400">
        Pre-filled issue → Cursor agent opens a PR → CI validates the override.
      </p>
    </div>
  )
}

export function MissingInheritancePanel({
  preset,
  dataUrl,
}: {
  preset: DenormalizedPreset
  dataUrl: string
}) {
  const location = useLocation()
  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${location.pathname}${location.searchStr}`
      : ''
  const { missingFieldInheritance, missingInheritanceStatus } = preset
  const disclosureId = `preset-missing-inheritance:${preset.id}`
  useAutoOpenFocusedIssue(disclosureId, 'missingInheritance', missingInheritanceStatus !== 'none')

  if (missingInheritanceStatus === 'none') return null

  const parentId =
    missingFieldInheritance?.fields?.parentId ?? missingFieldInheritance?.moreFields?.parentId

  const showCreateIssue =
    missingFieldInheritance &&
    (missingInheritanceStatus === 'unreviewed' || missingInheritanceStatus === 'stale')

  return (
    <SchemaIssueDisclosure
      disclosureId={disclosureId}
      variant={ISSUE_VARIANTS[missingInheritanceStatus]}
      title={ISSUE_TITLES[missingInheritanceStatus]}
      summary={STATUS_LABELS[missingInheritanceStatus]}
    >
      <div data-testid="missing-inheritance-panel">
        {missingFieldInheritance && parentId ? (
          <p>
            This preset defines an explicit field list without <code>{`{${parentId}}`}</code>, so it
            does not inherit every field from its slash parent.
          </p>
        ) : missingInheritanceStatus === 'stale' ? (
          <p>
            This preset no longer has missing slash-parent field inheritance, but a reviewed
            override entry still exists.
          </p>
        ) : null}
        {missingInheritanceStatus === 'stale' && missingFieldInheritance ? (
          <p className="mt-2">The stored override no longer matches the current schema.</p>
        ) : null}
        {missingInheritanceStatus === 'stale' && !missingFieldInheritance ? (
          <p className="mt-2">Open an issue to remove the stale override.</p>
        ) : null}
        {missingInheritanceStatus === 'unreviewed' ? (
          <p className="mt-2">
            If this omission is deliberate, record the current <code>missedFieldIds</code> snapshot.
          </p>
        ) : null}
        {showCreateIssue ? (
          <CreateIssueAction
            presetId={preset.id}
            missingFieldInheritance={missingFieldInheritance}
            dataUrl={dataUrl}
            pageUrl={pageUrl}
            includeStaleOverride={missingInheritanceStatus === 'stale'}
          />
        ) : null}
        <div className="mt-6 space-y-4">
          {missingFieldInheritance?.fields ? (
            <FieldListSection fieldListKey="fields" section={missingFieldInheritance.fields} />
          ) : null}
          {missingFieldInheritance?.moreFields ? (
            <FieldListSection
              fieldListKey="moreFields"
              section={missingFieldInheritance.moreFields}
            />
          ) : null}
        </div>
      </div>
    </SchemaIssueDisclosure>
  )
}

export const missingInheritanceFacetLabels: Record<string, string> = {
  none: 'Inherits from parent',
  unreviewed: 'Missing (unreviewed)',
  intentional: 'Missing (intentional)',
  stale: 'Override stale',
}
