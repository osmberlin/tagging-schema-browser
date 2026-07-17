import { Link } from '@tanstack/react-router'
import type { RiskyTypeCombo, RiskyTypeComboStatus } from '@/components/PagePresets/riskyTypeCombo'
import {
  SchemaOverrideCreateIssueAction,
  usePresetDetailPageUrl,
} from '@/components/PagePresets/SchemaOverrideCreateIssueAction'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { riskyTypeComboOverrides } from '@/data/riskyTypeComboOverrides'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
import type { SchemaIssueVariant } from '@/theme/schemaIssue'
import { buildRiskyTypeComboOverrideIssueUrl } from '@/utils/buildSchemaOverrideIssueUrl'
import type { DenormalizedPreset } from '@/utils/types'

const STATUS_LABELS: Record<RiskyTypeComboStatus, string> = {
  none: 'No risky typeCombo fields',
  unreviewed: 'Risky typeCombo (unreviewed)',
  intentional: 'Risky typeCombo (intentional)',
  stale: 'Override snapshot stale',
}

const ISSUE_TITLES: Record<Exclude<RiskyTypeComboStatus, 'none'>, string> = {
  unreviewed: 'Risky typeCombo',
  intentional: 'Intentional typeCombo',
  stale: 'Stale override',
}

const ISSUE_VARIANTS: Record<Exclude<RiskyTypeComboStatus, 'none'>, SchemaIssueVariant> = {
  unreviewed: 'warning',
  intentional: 'warning',
  stale: 'error',
}

function CreateIssueAction({
  presetId,
  riskyTypeCombo,
  dataUrl,
  pageUrl,
  storedOverride,
}: {
  presetId: string
  riskyTypeCombo?: RiskyTypeCombo | null
  dataUrl: string
  pageUrl: string
  storedOverride?: (typeof riskyTypeComboOverrides.presets)[string]
}) {
  const issueUrl = buildRiskyTypeComboOverrideIssueUrl({
    presetId,
    riskyTypeCombo,
    pageUrl,
    dataUrl,
    existingOverride: storedOverride,
  })

  return (
    <SchemaOverrideCreateIssueAction issueUrl={issueUrl} testId="risky-typecombo-create-issue" />
  )
}

function FieldSection({ riskyTypeCombo }: { riskyTypeCombo: RiskyTypeCombo }) {
  return (
    <div className="not-prose mt-6 space-y-2">
      <h3 className="text-sm font-semibold text-slate-100">Flagged fields</h3>
      <ul className="space-y-2">
        {riskyTypeCombo.fields.map((field) => (
          <li key={field.fieldId} className="text-sm text-slate-300">
            <Link
              to="/field/$"
              params={{ _splat: field.fieldId }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
              className="font-mono text-sky-300 underline underline-offset-2"
            >
              {field.fieldId}
            </Link>{' '}
            (<code>{field.fieldKey}</code>, {field.listKey}) — leaving this <code>typeCombo</code>{' '}
            empty in iD can write <code>{field.fieldKey}=yes</code>.
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RiskyTypeComboPanel({
  preset,
  dataUrl,
}: {
  preset: DenormalizedPreset
  dataUrl: string
}) {
  const pageUrl = usePresetDetailPageUrl()
  const { riskyTypeCombo, riskyTypeComboStatus } = preset
  const disclosureId = `preset-risky-typecombo:${preset.id}`
  useAutoOpenFocusedIssue(disclosureId, 'riskyTypeCombo', riskyTypeComboStatus !== 'none')

  if (riskyTypeComboStatus === 'none') return null

  const storedOverride = riskyTypeComboOverrides.presets[preset.id]

  const showCreateIssue =
    (riskyTypeComboStatus === 'unreviewed' && riskyTypeCombo) ||
    (riskyTypeComboStatus === 'stale' && (riskyTypeCombo || storedOverride))

  return (
    <SchemaIssueDisclosure
      disclosureId={disclosureId}
      variant={ISSUE_VARIANTS[riskyTypeComboStatus]}
      title={ISSUE_TITLES[riskyTypeComboStatus]}
      summary={STATUS_LABELS[riskyTypeComboStatus]}
    >
      <div data-testid="risky-typecombo-panel">
        <p>
          This preset exposes one or more <code>typeCombo</code> fields that behave like properties
          on a preset with fixed tags. In iD, opening the dropdown and backing out can silently add{' '}
          <code>=yes</code> tags.
        </p>
        {riskyTypeComboStatus === 'stale' && !riskyTypeCombo ? (
          <p className="mt-2">Open an issue to remove the stale override.</p>
        ) : null}
        {riskyTypeComboStatus === 'stale' && riskyTypeCombo ? (
          <p className="mt-2">The stored override no longer matches the current schema.</p>
        ) : null}
        {riskyTypeComboStatus === 'unreviewed' ? (
          <p className="mt-2">
            If keeping <code>typeCombo</code> is deliberate, record the current{' '}
            <code>fieldIds</code> snapshot.
          </p>
        ) : null}
        {showCreateIssue ? (
          <CreateIssueAction
            presetId={preset.id}
            riskyTypeCombo={riskyTypeCombo}
            dataUrl={dataUrl}
            pageUrl={pageUrl}
            storedOverride={storedOverride}
          />
        ) : null}
        {riskyTypeCombo ? <FieldSection riskyTypeCombo={riskyTypeCombo} /> : null}
      </div>
    </SchemaIssueDisclosure>
  )
}

export const riskyTypeComboFacetLabels: Record<string, string> = {
  none: 'No risky typeCombo',
  unreviewed: 'Risky (unreviewed)',
  intentional: 'Risky (intentional)',
  stale: 'Override stale',
}
