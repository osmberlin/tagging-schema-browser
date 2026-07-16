import { Link } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import type {
  FieldListKey,
  MissingFieldInheritance,
  MissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'
import { formatMissingInheritanceOverrideYaml } from '@/components/PagePresets/missingFieldInheritance'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
import type { SchemaIssueVariant } from '@/theme/schemaIssue'
import { schemaIssueStyles } from '@/theme/schemaIssue'
import { MISSING_INHERITANCE_OVERRIDES_EDIT_URL } from '@/utils/constants'
import { cn } from '@/utils/tw'
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
    <div className={cn('not-prose space-y-2 px-3 py-3', schemaIssueStyles.disclosureBodyInset)}>
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

function OverridesYamlLink() {
  return (
    <a
      href={MISSING_INHERITANCE_OVERRIDES_EDIT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={schemaIssueStyles.externalLink}
    >
      missing-inheritance-overrides.yaml
    </a>
  )
}

function OverrideSnippet({
  presetId,
  missingFieldInheritance,
}: {
  presetId: string
  missingFieldInheritance: MissingFieldInheritance
}) {
  const snippet = formatMissingInheritanceOverrideYaml(presetId, missingFieldInheritance)
  const [copied, setCopied] = useState(false)

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
      <ol className="list-decimal space-y-1.5 ps-5 text-sm text-slate-300">
        <li>Copy the YAML snippet below.</li>
        <li>
          Paste it under <code>presets:</code> in <OverridesYamlLink /> (keep two-space indent). CI
          validates overrides against the published release schema.
        </li>
      </ol>
      <div className="flex items-center justify-between gap-3">
        <p className="mb-0 min-w-0 flex-1 text-sm text-slate-400">Snippet for {presetId}:</p>
        <div className="not-prose shrink-0">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-sm transition hover:bg-slate-700"
          >
            {copied ? 'Copied' : 'Copy snippet'}
          </button>
        </div>
      </div>
      <pre
        className="overflow-x-auto rounded-md border border-slate-600 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100"
        data-testid="missing-inheritance-override-snippet"
      >
        {snippet}
      </pre>
    </div>
  )
}

export function MissingInheritancePanel({ preset }: { preset: DenormalizedPreset }) {
  const { missingFieldInheritance, missingInheritanceStatus } = preset
  const disclosureId = `preset-missing-inheritance:${preset.id}`
  useAutoOpenFocusedIssue(disclosureId, 'missingInheritance', missingInheritanceStatus !== 'none')

  if (missingInheritanceStatus === 'none') return null

  const parentId =
    missingFieldInheritance?.fields?.parentId ?? missingFieldInheritance?.moreFields?.parentId

  const showOverrideSnippet =
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
            This preset no longer has missing slash-parent field inheritance, but an override entry
            still exists in <OverridesYamlLink />.
          </p>
        ) : null}
        {missingInheritanceStatus === 'stale' && missingFieldInheritance ? (
          <p className="mt-2">
            The reviewed override in <OverridesYamlLink /> no longer matches — re-check and update
            the snapshot or remove the entry.
          </p>
        ) : null}
        {missingInheritanceStatus === 'stale' && !missingFieldInheritance ? (
          <p className="mt-2">
            Remove the stale entry from <OverridesYamlLink />.
          </p>
        ) : null}
        {missingInheritanceStatus === 'unreviewed' ? (
          <p className="mt-2">
            If this omission is deliberate, record the current <code>missedFieldIds</code> snapshot
            in <OverridesYamlLink />:
          </p>
        ) : null}
        {showOverrideSnippet ? (
          <OverrideSnippet presetId={preset.id} missingFieldInheritance={missingFieldInheritance} />
        ) : null}
        <div className="mt-4 space-y-4">
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
