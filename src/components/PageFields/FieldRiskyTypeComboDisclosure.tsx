import { Link } from '@tanstack/react-router'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
import type { FieldRiskyTypeComboUsage } from '@/utils/types'

const STATUS_LABELS: Record<FieldRiskyTypeComboUsage['status'], string> = {
  none: 'Not flagged',
  unreviewed: 'Risky (unreviewed)',
  intentional: 'Intentional',
  stale: 'Override stale',
}

export function FieldRiskyTypeComboDisclosure({
  fieldId,
  fieldType,
  usages,
}: {
  fieldId: string
  fieldType: string
  usages: FieldRiskyTypeComboUsage[]
}) {
  const applies = fieldType === 'typeCombo' && usages.length > 0
  const flaggedUsages = usages.filter((usage) => usage.flagged)
  const unreviewedCount = flaggedUsages.filter((usage) => usage.status === 'unreviewed').length
  const disclosureId = `field-risky-typecombo:${fieldId}`
  useAutoOpenFocusedIssue(disclosureId, 'riskyTypeCombo', applies && flaggedUsages.length > 0)

  if (!applies) return null

  const summary =
    unreviewedCount > 0
      ? `${unreviewedCount} preset usage${unreviewedCount === 1 ? '' : 's'} flagged as risky typeCombo`
      : flaggedUsages.length > 0
        ? `${flaggedUsages.length} reviewed preset usage${flaggedUsages.length === 1 ? '' : 's'}`
        : `${usages.length} preset usage${usages.length === 1 ? '' : 's'} — none flagged`

  return (
    <SchemaIssueDisclosure
      disclosureId={disclosureId}
      variant={unreviewedCount > 0 ? 'warning' : 'warning'}
      title="Risky typeCombo usage"
      summary={summary}
      bodyClassName="not-prose"
    >
      <div data-testid="field-risky-typecombo-panel">
        <p className="text-sm text-slate-300">
          On presets with fixed tags, a property <code>typeCombo</code> can silently write{' '}
          <code>=yes</code> when a mapper opens the dropdown and backs out without choosing.
        </p>
        <ul className="mt-4 space-y-2">
          {usages.map((usage) => (
            <li
              key={`${usage.presetId}:${usage.listKey}`}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slate-200"
            >
              <Link
                to="/preset/$"
                params={{ _splat: usage.presetId }}
                search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                className="font-mono text-sky-300 underline underline-offset-2"
              >
                {usage.presetId}
              </Link>
              <span className="text-slate-400">({usage.listKey})</span>
              <span
                className={
                  usage.flagged
                    ? usage.status === 'stale'
                      ? 'text-rose-300'
                      : usage.status === 'intentional'
                        ? 'text-slate-400'
                        : 'text-amber-200'
                    : 'text-slate-500'
                }
              >
                {usage.flagged ? STATUS_LABELS[usage.status] : 'Not flagged on this preset'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SchemaIssueDisclosure>
  )
}
