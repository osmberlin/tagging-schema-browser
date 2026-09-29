import { Link } from '@tanstack/react-router'
import { auditPageHref } from '@/components/PageAudits/auditPageHref'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import type { FieldRiskyTypeComboUsage } from '@/utils/types'

const STATUS_LABELS: Record<FieldRiskyTypeComboUsage['status'], string> = {
  none: 'Not flagged',
  unreviewed: 'Risky (unreviewed)',
  intentional: 'Intentional',
  stale: 'Override stale',
}

export function FieldRiskyTypeComboNotice({
  fieldType,
  usages,
  dataUrl = '',
}: {
  fieldId?: string
  fieldType: string
  usages: FieldRiskyTypeComboUsage[]
  dataUrl?: string
}) {
  const applies = fieldType === 'typeCombo' && usages.length > 0
  const flaggedUsages = usages.filter((usage) => usage.flagged)
  const unreviewedUsages = flaggedUsages.filter((usage) => usage.status === 'unreviewed')

  if (!applies || flaggedUsages.length === 0) return null

  return (
    <section
      data-testid="field-risky-typecombo-panel"
      className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-4"
    >
      <h2 className="font-display text-lg font-semibold text-amber-950">Risky typeCombo usage</h2>
      <p className="mt-1 text-sm text-amber-900/80">
        {unreviewedUsages.length > 0
          ? `${unreviewedUsages.length} preset usage${unreviewedUsages.length === 1 ? '' : 's'} flagged as risky typeCombo`
          : `${flaggedUsages.length} reviewed preset usage${flaggedUsages.length === 1 ? '' : 's'}`}
      </p>
      <p className="mt-3 text-sm text-slate-700">
        On presets with fixed tags, a property <code>typeCombo</code> can silently write{' '}
        <code>=yes</code> when a mapper opens the dropdown and backs out without choosing.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {usages.map((usage) => (
          <li
            key={`${usage.presetId}:${usage.listKey}`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
          >
            <Link
              to="/preset/$"
              params={{ _splat: usage.presetId }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
              className="font-mono text-sky-700 underline underline-offset-2"
            >
              {usage.presetId}
            </Link>
            <span className="text-slate-500">({usage.listKey})</span>
            <span
              className={
                usage.flagged
                  ? usage.status === 'stale'
                    ? 'text-rose-700'
                    : usage.status === 'intentional'
                      ? 'text-slate-500'
                      : 'text-amber-800'
                  : 'text-slate-400'
              }
            >
              {usage.flagged ? STATUS_LABELS[usage.status] : 'Not flagged on this preset'}
            </span>
            {usage.flagged && usage.status === 'unreviewed' ? (
              <a
                href={auditPageHref({
                  slug: 'risky-typecombo',
                  dataUrl,
                  selected: usage.presetId,
                })}
                className={cn(
                  'text-sm font-medium underline underline-offset-2',
                  areaAccent.fields.link,
                )}
              >
                audit →
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      {unreviewedUsages.length > 0 ? (
        <a
          href={auditPageHref({
            slug: 'risky-typecombo',
            dataUrl,
            selected: unreviewedUsages[0]?.presetId ?? '',
          })}
          className={cn(
            'mt-4 inline-flex font-medium underline underline-offset-2',
            areaAccent.fields.link,
          )}
        >
          Open risky typeCombo audit →
        </a>
      ) : null}
    </section>
  )
}
