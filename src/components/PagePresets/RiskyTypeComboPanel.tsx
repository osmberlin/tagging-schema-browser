import { Link, useLocation } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import type { RiskyTypeCombo, RiskyTypeComboStatus } from '@/components/PagePresets/riskyTypeCombo'
import { formatRiskyTypeComboOverrideYaml } from '@/components/PagePresets/riskyTypeCombo'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { riskyTypeComboOverrides } from '@/data/riskyTypeComboOverrides'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
import { externalActionPillClass } from '@/theme/externalAccent'
import type { SchemaIssueVariant } from '@/theme/schemaIssue'
import { schemaIssueStyles } from '@/theme/schemaIssue'
import { buildRiskyTypeComboOverrideIssueUrl } from '@/utils/buildSchemaOverrideIssueUrl'
import { RISKY_TYPECOMBO_OVERRIDES_EDIT_URL } from '@/utils/constants'
import { cn } from '@/utils/tw'
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

function OverridesYamlLink() {
  return (
    <a
      href={RISKY_TYPECOMBO_OVERRIDES_EDIT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={schemaIssueStyles.externalLink}
    >
      risky-typecombo-overrides.yaml
    </a>
  )
}

function OverrideSnippet({
  presetId,
  riskyTypeCombo,
  dataUrl,
  pageUrl,
  includeStaleOverride,
}: {
  presetId: string
  riskyTypeCombo: RiskyTypeCombo
  dataUrl: string
  pageUrl: string
  includeStaleOverride: boolean
}) {
  const snippet = formatRiskyTypeComboOverrideYaml(presetId, riskyTypeCombo)
  const [copied, setCopied] = useState(false)
  const issueUrl = buildRiskyTypeComboOverrideIssueUrl({
    presetId,
    riskyTypeCombo,
    pageUrl,
    dataUrl,
    existingOverride: includeStaleOverride ? riskyTypeComboOverrides.presets[presetId] : undefined,
  })

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [snippet])

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-slate-300">
        Open a pre-filled GitHub issue to record this snapshot. A Cursor agent will open a PR; CI
        validates overrides against the published release schema.
      </p>
      <div className="not-prose flex flex-wrap items-center gap-2">
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={externalActionPillClass('border border-mauve-200 bg-mauve-50/80')}
          data-testid="risky-typecombo-create-issue"
        >
          Create GitHub issue ↗
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-sm transition hover:bg-slate-700"
        >
          {copied ? 'Copied' : 'Copy snippet'}
        </button>
      </div>
      <p className="text-sm text-slate-400">
        Fallback: paste the snippet under <code>presets:</code> in <OverridesYamlLink />.
      </p>
      <p className="text-sm text-slate-400">Snippet for {presetId}:</p>
      <pre
        className="overflow-x-auto rounded-md border border-slate-600 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100"
        data-testid="risky-typecombo-override-snippet"
      >
        {snippet}
      </pre>
    </div>
  )
}

function FieldSection({ riskyTypeCombo }: { riskyTypeCombo: RiskyTypeCombo }) {
  return (
    <div className={cn('not-prose space-y-2 px-3 py-3', schemaIssueStyles.disclosureBodyInset)}>
      <h3 className="text-sm font-semibold text-slate-100">Flagged fields</h3>
      <ul className="space-y-3">
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
  const location = useLocation()
  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${location.pathname}${location.searchStr}`
      : ''
  const { riskyTypeCombo, riskyTypeComboStatus } = preset
  const disclosureId = `preset-risky-typecombo:${preset.id}`
  useAutoOpenFocusedIssue(disclosureId, 'riskyTypeCombo', riskyTypeComboStatus !== 'none')

  if (riskyTypeComboStatus === 'none') return null

  const showOverrideSnippet =
    riskyTypeCombo && (riskyTypeComboStatus === 'unreviewed' || riskyTypeComboStatus === 'stale')

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
          <p className="mt-2">
            Remove the stale entry from <OverridesYamlLink />.
          </p>
        ) : null}
        {riskyTypeComboStatus === 'stale' && riskyTypeCombo ? (
          <p className="mt-2">
            The reviewed override in <OverridesYamlLink /> no longer matches — re-check and update
            the snapshot or remove the entry.
          </p>
        ) : null}
        {riskyTypeComboStatus === 'unreviewed' ? (
          <p className="mt-2">
            If keeping <code>typeCombo</code> is deliberate, record the current{' '}
            <code>fieldIds</code> snapshot via GitHub issue or manual edit in <OverridesYamlLink />.
          </p>
        ) : null}
        {showOverrideSnippet ? (
          <OverrideSnippet
            presetId={preset.id}
            riskyTypeCombo={riskyTypeCombo}
            dataUrl={dataUrl}
            pageUrl={pageUrl}
            includeStaleOverride={riskyTypeComboStatus === 'stale'}
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
