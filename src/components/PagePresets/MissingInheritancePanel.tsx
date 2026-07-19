import { Link } from '@tanstack/react-router'
import type {
  FieldListKey,
  MissingFieldInheritance,
  MissingInheritanceOverride,
  MissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'
import { resolveMissingInheritanceListStatus } from '@/components/PagePresets/missingFieldInheritance'
import {
  SchemaOverrideCreateIssueAction,
  usePresetDetailPageUrl,
} from '@/components/PagePresets/SchemaOverrideCreateIssueAction'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { missingInheritanceOverrides } from '@/data/missingInheritanceOverrides'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
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
  storedOverride,
}: {
  fieldListKey: FieldListKey
  section: NonNullable<MissingFieldInheritance[FieldListKey]>
  storedOverride?: MissingInheritanceOverride
}) {
  const title = fieldListKey === 'fields' ? 'Primary fields' : 'More fields'
  const listStatus = resolveMissingInheritanceListStatus(section, storedOverride?.[fieldListKey])
  return (
    <div className="not-prose space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <span className="text-xs text-slate-400">{STATUS_LABELS[listStatus]}</span>
      </div>
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
  storedOverride,
}: {
  presetId: string
  missingFieldInheritance?: MissingFieldInheritance | null
  dataUrl: string
  pageUrl: string
  storedOverride?: (typeof missingInheritanceOverrides.presets)[string]
}) {
  const issueUrl = buildMissingInheritanceOverrideIssueUrl({
    presetId,
    missingFieldInheritance,
    pageUrl,
    dataUrl,
    existingOverride: storedOverride,
  })

  return (
    <SchemaOverrideCreateIssueAction
      issueUrl={issueUrl}
      testId="missing-inheritance-create-issue"
    />
  )
}

export function MissingInheritancePanel({
  preset,
  dataUrl,
}: {
  preset: DenormalizedPreset
  dataUrl: string
}) {
  const pageUrl = usePresetDetailPageUrl()
  const { missingFieldInheritance, missingInheritanceStatus } = preset
  const disclosureId = `preset-missing-inheritance:${preset.id}`
  useAutoOpenFocusedIssue(disclosureId, 'missingInheritance', missingInheritanceStatus !== 'none')

  if (missingInheritanceStatus === 'none') return null

  const parentId =
    missingFieldInheritance?.fields?.parentId ?? missingFieldInheritance?.moreFields?.parentId

  const storedOverride = missingInheritanceOverrides.presets[preset.id]

  const showCreateIssue =
    (missingInheritanceStatus === 'unreviewed' && missingFieldInheritance) ||
    (missingInheritanceStatus === 'stale' && (missingFieldInheritance || storedOverride))

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
            <code>fields</code> and <code>moreFields</code> are independent — you may document one
            list without the other when only that list omits slash-parent inheritance.
          </p>
        ) : null}
        {showCreateIssue ? (
          <CreateIssueAction
            presetId={preset.id}
            missingFieldInheritance={missingFieldInheritance}
            dataUrl={dataUrl}
            pageUrl={pageUrl}
            storedOverride={storedOverride}
          />
        ) : null}
        <div className="mt-6 space-y-4">
          {missingFieldInheritance?.fields ? (
            <FieldListSection
              fieldListKey="fields"
              section={missingFieldInheritance.fields}
              storedOverride={storedOverride}
            />
          ) : null}
          {missingFieldInheritance?.moreFields ? (
            <FieldListSection
              fieldListKey="moreFields"
              section={missingFieldInheritance.moreFields}
              storedOverride={storedOverride}
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
