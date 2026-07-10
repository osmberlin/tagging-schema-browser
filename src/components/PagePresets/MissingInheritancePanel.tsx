import { Link } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import type {
  FieldListKey,
  MissingFieldInheritance,
  MissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'
import { formatMissingInheritanceOverrideYaml } from '@/components/PagePresets/missingFieldInheritance'
import { externalLinkClass } from '@/theme/externalAccent'
import { MISSING_INHERITANCE_OVERRIDES_EDIT_URL } from '@/utils/constants'
import type { DenormalizedPreset } from '@/utils/types'

const STATUS_LABELS: Record<MissingInheritanceStatus, string> = {
  none: 'Inherits from slash parent',
  unreviewed: 'Missing parent fields (unreviewed)',
  intentional: 'Missing parent fields (intentional)',
  stale: 'Override snapshot stale',
}

const STATUS_CLASSES: Record<MissingInheritanceStatus, string> = {
  none: 'border-slate-200 bg-slate-50 text-slate-700',
  unreviewed: 'border-amber-200 bg-amber-50 text-amber-900',
  intentional: 'border-sky-200 bg-sky-50 text-sky-900',
  stale: 'border-rose-200 bg-rose-50 text-rose-900',
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
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-600">
        Expected slash-parent source:{' '}
        <Link
          to="/preset/$"
          params={{ _splat: section.parentId }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          className="font-mono text-xs text-sky-700 underline underline-offset-2"
        >
          {section.parentId}
        </Link>
      </p>
      <p className="text-sm text-slate-600">Field ids not inherited from the parent list:</p>
      <ul className="list-inside list-disc font-mono text-xs text-slate-800">
        {section.missedFieldIds.map((fieldId) => (
          <li key={fieldId}>{fieldId}</li>
        ))}
      </ul>
      {section.explicitPresetRefs.length > 0 ? (
        <p className="text-xs text-slate-500">
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
      className={`font-mono text-xs ${externalLinkClass()}`}
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
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">
          Paste under <code className="font-mono text-xs">presets:</code> in <OverridesYamlLink />:
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
        >
          {copied ? 'Copied' : 'Copy snippet'}
        </button>
      </div>
      <pre
        className="overflow-x-auto rounded-md border border-amber-200 bg-white/80 p-3 font-mono text-xs leading-relaxed text-slate-800"
        data-testid="missing-inheritance-override-snippet"
      >
        {snippet}
      </pre>
    </div>
  )
}

export function MissingInheritancePanel({ preset }: { preset: DenormalizedPreset }) {
  const { missingFieldInheritance, missingInheritanceStatus } = preset
  if (missingInheritanceStatus === 'none') return null

  const parentId =
    missingFieldInheritance?.fields?.parentId ?? missingFieldInheritance?.moreFields?.parentId

  const showOverrideSnippet =
    missingFieldInheritance &&
    (missingInheritanceStatus === 'unreviewed' || missingInheritanceStatus === 'stale')

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${STATUS_CLASSES[missingInheritanceStatus]}`}
      data-testid="missing-inheritance-panel"
    >
      <p className="text-sm font-semibold">{STATUS_LABELS[missingInheritanceStatus]}</p>
      {missingFieldInheritance && parentId ? (
        <p className="mt-1 text-sm">
          This preset defines an explicit field list without <code>{`{${parentId}}`}</code>, so it
          does not inherit every field from its slash parent.
        </p>
      ) : missingInheritanceStatus === 'stale' ? (
        <p className="mt-1 text-sm">
          This preset no longer has missing slash-parent field inheritance, but an override entry
          still exists in <OverridesYamlLink />.
        </p>
      ) : null}
      {missingInheritanceStatus === 'stale' && missingFieldInheritance ? (
        <p className="mt-2 text-sm">
          The reviewed override in <OverridesYamlLink /> no longer matches — re-check and update the
          snapshot or remove the entry.
        </p>
      ) : null}
      {missingInheritanceStatus === 'stale' && !missingFieldInheritance ? (
        <p className="mt-2 text-sm">
          Remove the stale entry from <OverridesYamlLink />.
        </p>
      ) : null}
      {missingInheritanceStatus === 'unreviewed' ? (
        <p className="mt-2 text-sm">
          If this omission is deliberate, add an entry to <OverridesYamlLink /> with the current{' '}
          <code className="font-mono text-xs">missedFieldIds</code> snapshot.
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
  )
}

export const missingInheritanceFacetLabels: Record<string, string> = {
  none: 'Inherits from parent',
  unreviewed: 'Missing (unreviewed)',
  intentional: 'Missing (intentional)',
  stale: 'Override stale',
}
