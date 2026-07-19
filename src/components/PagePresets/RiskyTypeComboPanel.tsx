import { Link } from '@tanstack/react-router'
import { auditPageHref } from '@/components/PageAudits/auditPageHref'
import type { RiskyTypeCombo, RiskyTypeComboStatus } from '@/components/PagePresets/riskyTypeCombo'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset } from '@/utils/types'

const STATUS_LABELS: Record<RiskyTypeComboStatus, string> = {
  none: 'No risky typeCombo fields',
  unreviewed: 'Risky typeCombo (unreviewed)',
  intentional: 'Risky typeCombo (intentional)',
  stale: 'Override snapshot stale',
}

function FieldSection({ riskyTypeCombo }: { riskyTypeCombo: RiskyTypeCombo }) {
  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {riskyTypeCombo.fields.map((field) => (
        <li key={field.fieldId}>
          <Link
            to="/field/$"
            params={{ _splat: field.fieldId }}
            search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
            className="font-mono text-sky-700 underline underline-offset-2"
          >
            {field.fieldId}
          </Link>{' '}
          (<code>{field.fieldKey}</code>, {field.listKey}) — leaving this <code>typeCombo</code>{' '}
          empty in iD can write <code>{field.fieldKey}=yes</code>.
        </li>
      ))}
    </ul>
  )
}

export function RiskyTypeComboPanel({
  preset,
  dataUrl = '',
}: {
  preset: DenormalizedPreset
  dataUrl?: string
}) {
  const { riskyTypeCombo, riskyTypeComboStatus } = preset

  if (riskyTypeComboStatus === 'none') return null

  const needsAudit = riskyTypeComboStatus === 'unreviewed' || riskyTypeComboStatus === 'stale'
  const auditHref = auditPageHref({
    slug: 'risky-typecombo',
    dataUrl,
    selected: preset.id,
  })

  return (
    <section
      data-testid="risky-typecombo-panel"
      className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-amber-950">Risky typeCombo</h2>
          <p className="mt-1 text-sm text-amber-900/80">{STATUS_LABELS[riskyTypeComboStatus]}</p>
        </div>
        {needsAudit ? (
          <a
            href={auditHref}
            className={cn(
              'inline-flex shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-amber-900 ring-1 ring-amber-200 ring-inset hover:bg-amber-100',
            )}
          >
            Open audit →
          </a>
        ) : null}
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <p>
          This preset exposes one or more <code>typeCombo</code> fields that behave like properties
          on a preset with fixed tags. In iD, opening the dropdown and backing out can silently add{' '}
          <code>=yes</code> tags.
        </p>
        {riskyTypeComboStatus === 'stale' && !riskyTypeCombo ? (
          <p>
            The stored override no longer matches the current schema — remove it on the audit page.
          </p>
        ) : null}
        {riskyTypeCombo ? <FieldSection riskyTypeCombo={riskyTypeCombo} /> : null}
        {needsAudit ? (
          <a
            href={auditHref}
            className={cn(
              'inline-flex font-medium underline underline-offset-2',
              areaAccent.fields.link,
            )}
          >
            Review on audit page →
          </a>
        ) : null}
      </div>
    </section>
  )
}
