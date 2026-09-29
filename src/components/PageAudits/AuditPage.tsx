import { useForm } from '@tanstack/react-form'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useRef } from 'react'
import { z } from 'zod'
import {
  AUDIT_DECISION_HELP,
  AUDIT_DECISION_LABELS,
  AUDIT_DECISION_SHORT_LABELS,
  auditDecisionIncludesIssue,
  type AuditDecision,
} from '@/components/PageAudits/auditDecisions'
import {
  auditEntriesForSlug,
  auditEntryNeedsAction,
  invalidOverrideMissedFieldIds,
  isOrphanedStaleMissingInheritanceEntry,
  validDocumentedMissedFieldIds,
  type AuditEntry,
} from '@/components/PageAudits/auditEntries'
import {
  AuditSchemaLoadingPanel,
  AuditSchemaRefreshBanner,
} from '@/components/PageAudits/AuditSchemaStatus'
import { AUDIT_META, isAuditSlug } from '@/components/PageAudits/auditSlugs'
import { buildBatchSchemaOverrideIssueUrl } from '@/components/PageAudits/buildBatchOverrideIssueUrl'
import { fieldListTitle } from '@/components/PageAudits/fieldListTitle'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { externalActionPillClass } from '@/theme/externalAccent'
import { cn } from '@/utils/tw'

/** Keep data source + locale when linking to preset/field detail pages. */
const keepDataSource = (prev: { dataUrl?: string; locale?: string }) => ({
  dataUrl: prev.dataUrl ?? '',
  locale: prev.locale ?? '',
})

const auditSearchSchema = z.object({
  selected: z.string().catch(''),
})

type AuditFormValues = {
  decisions: Record<string, AuditDecision>
}

const ACTIONABLE_DECISIONS: Exclude<AuditDecision, 'pending'>[] = [
  'intentional',
  'remove_stale',
  'needs_work',
]

// "False positive" makes no sense for stale rows; "Delete outdated override" only for stale rows.
function actionableDecisionsForEntry(entry: AuditEntry): Exclude<AuditDecision, 'pending'>[] {
  return ACTIONABLE_DECISIONS.filter((decision) =>
    entry.status === 'stale' ? decision !== 'intentional' : decision !== 'remove_stale',
  )
}

function decisionButtonClass(active: boolean) {
  return cn(
    'min-w-[9.5rem] rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  )
}

function AuditDecisionActions({
  entry,
  decision,
  onDecisionChange,
}: {
  entry: AuditEntry
  decision: AuditDecision
  onDecisionChange: (decision: AuditDecision) => void
}) {
  const options = actionableDecisionsForEntry(entry)

  return (
    <div className="flex min-w-[14rem] flex-col gap-2">
      <div
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3"
        role="group"
        aria-label={`Decision for ${entry.presetId}`}
      >
        {options.map((option) => {
          const active = decision === option
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              className={decisionButtonClass(active)}
              onClick={() => onDecisionChange(active ? 'pending' : option)}
            >
              {AUDIT_DECISION_SHORT_LABELS[option]}
            </button>
          )
        })}
      </div>
      {decision !== 'pending' ? (
        <p className="text-xs leading-relaxed text-slate-500">{AUDIT_DECISION_HELP[decision]}</p>
      ) : null}
    </div>
  )
}

function AuditEntryRow({
  entry,
  selected,
  decision,
  onDecisionChange,
  showPresetCell,
  presetRowSpan,
  presetGroupStart,
}: {
  entry: AuditEntry
  selected: boolean
  decision: AuditDecision
  onDecisionChange: (decision: AuditDecision) => void
  showPresetCell: boolean
  presetRowSpan: number
  presetGroupStart: boolean
}) {
  const rowRef = useRef<HTMLTableRowElement>(null)

  useEffect(
    function scrollSelectedAuditRowIntoView() {
      if (!selected || !rowRef.current) return
      rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    },
    [selected],
  )

  return (
    <tr
      ref={rowRef}
      data-audit-entry={entry.entryId}
      className={cn(
        'border-b border-slate-100 align-top',
        presetGroupStart && 'border-t-2 border-t-slate-200',
        selected && 'bg-amber-50/80 ring-1 ring-amber-200 ring-inset',
      )}
    >
      {showPresetCell ? (
        <td className="px-3 py-3 align-top" rowSpan={presetRowSpan}>
          <div className="space-y-1">
            <Link
              to="/preset/$"
              params={{ _splat: entry.presetId }}
              search={keepDataSource}
              className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-sky-700"
            >
              {entry.presetName}
            </Link>
            <p className="font-mono text-xs text-slate-500">{entry.presetId}</p>
            {presetRowSpan > 1 ? (
              <p className="text-xs text-slate-400">{presetRowSpan} lists</p>
            ) : null}
          </div>
        </td>
      ) : null}
      <td className="px-3 py-3 text-sm text-slate-700">
        {entry.kind === 'missing-inheritance' ? (
          <div className="space-y-2">
            <p>
              <span className="font-medium text-slate-900">
                {fieldListTitle(entry.fieldListKey)}
              </span>{' '}
              — parent{' '}
              <Link
                to="/preset/$"
                params={{ _splat: entry.parentId }}
                search={keepDataSource}
                className="font-mono text-xs text-sky-700 underline underline-offset-2"
              >
                {entry.parentId}
              </Link>
            </p>
            {isOrphanedStaleMissingInheritanceEntry(entry) ? (
              <>
                <p className="text-xs text-slate-500">Stale override (live detection gone):</p>
                <ul className="list-inside list-disc font-mono text-xs text-slate-800">
                  {entry.documentedMissedFieldIds.length > 0 ? (
                    entry.documentedMissedFieldIds.map((fieldId) => (
                      <li key={fieldId}>{fieldId}</li>
                    ))
                  ) : (
                    <li className="text-slate-500">None</li>
                  )}
                </ul>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500">Still needs a decision:</p>
                <ul className="list-inside list-disc font-mono text-xs text-slate-800">
                  {entry.missedFieldIds.length > 0 ? (
                    entry.missedFieldIds.map((fieldId) => (
                      <li key={fieldId}>
                        <Link
                          to="/field/$"
                          params={{ _splat: fieldId }}
                          search={keepDataSource}
                          className="text-sky-700 underline underline-offset-2"
                        >
                          {fieldId}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500">None</li>
                  )}
                </ul>
                {validDocumentedMissedFieldIds(entry).length > 0 ? (
                  <>
                    <p className="text-xs text-slate-500">
                      Already documented as intentional skips:
                    </p>
                    <ul className="list-inside list-disc font-mono text-xs text-slate-500">
                      {validDocumentedMissedFieldIds(entry).map((fieldId) => (
                        <li key={fieldId}>{fieldId}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {entry.status === 'stale' && invalidOverrideMissedFieldIds(entry).length > 0 ? (
                  <>
                    <p className="text-xs text-rose-600">
                      Override ids no longer missing on live preset:
                    </p>
                    <ul className="list-inside list-disc font-mono text-xs text-rose-700">
                      {invalidOverrideMissedFieldIds(entry).map((fieldId) => (
                        <li key={fieldId}>{fieldId}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </>
            )}
            {entry.explicitPresetRefs.length > 0 ? (
              <p className="text-xs text-slate-500">
                Other preset refs: {entry.explicitPresetRefs.join(', ')}
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {entry.riskyTypeCombo.fields.map((field) => (
              <li key={`${field.fieldId}:${field.listKey}`}>
                <Link
                  to="/field/$"
                  params={{ _splat: field.fieldId }}
                  search={keepDataSource}
                  className="font-mono text-xs text-sky-700 underline underline-offset-2"
                >
                  {field.fieldId}
                </Link>{' '}
                <span className="text-slate-500">
                  (<code>{field.fieldKey}</code>, {field.listKey})
                </span>
                <span className="block text-xs text-slate-600">
                  Leaving this <code>typeCombo</code> empty in iD can write{' '}
                  <code>{field.fieldKey}=yes</code>.
                </span>
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="px-3 py-3 text-sm">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            entry.status === 'stale'
              ? 'bg-rose-50 text-rose-800 ring-rose-100'
              : 'bg-amber-50 text-amber-800 ring-amber-100',
          )}
        >
          {entry.status}
        </span>
      </td>
      <td className="w-[38%] min-w-[14rem] px-3 py-3 align-top">
        <AuditDecisionActions
          entry={entry}
          decision={decision}
          onDecisionChange={onDecisionChange}
        />
      </td>
    </tr>
  )
}

export function AuditDetailPage() {
  const { slug: slugParam } = useParams({ strict: false })
  const slug = slugParam && isAuditSlug(slugParam) ? slugParam : null
  const { selected } = useSearch({ strict: false, select: (raw) => auditSearchSchema.parse(raw) })
  const { presets, data, dataUrl, reference, loading } = useSchema()

  const entries = useMemo(() => {
    if (!slug || !data) return []
    return auditEntriesForSlug(slug, presets).filter(auditEntryNeedsAction)
  }, [slug, data, presets])

  const presetGroups = useMemo(() => {
    const groups: { presetId: string; entries: AuditEntry[] }[] = []
    for (const entry of entries) {
      const last = groups.at(-1)
      if (last?.presetId === entry.presetId) last.entries.push(entry)
      else groups.push({ presetId: entry.presetId, entries: [entry] })
    }
    return groups
  }, [entries])

  // Missing keys mean "pending"; only decisions for currently listed entries are counted/used.
  const form = useForm({ defaultValues: { decisions: {} } as AuditFormValues })

  useEffect(
    function resetAuditFormWhenSlugChanges() {
      form.reset({ decisions: {} })
    },
    [slug, form],
  )

  if (!slug) {
    return <p className="text-sm text-slate-600">Unknown audit.</p>
  }

  const meta = AUDIT_META[slug]

  if (loading && !data) {
    return <AuditSchemaLoadingPanel />
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        Load schema data from the Presets page first (enter a data URL and click Load).
      </p>
    )
  }

  const actionableCount = entries.length

  return (
    <div className="space-y-4 pb-12">
      <header className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          <AreaIcon area={meta.area} className={`h-7 w-7 ${areaAccent[meta.area].icon}`} />
          Audit: {meta.title}
          <CountPill className="text-sm">{actionableCount}</CountPill>
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">{meta.description}</p>
        <details className="max-w-3xl text-sm text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900">
            How does this work?
          </summary>
          <p className="mt-2">
            Pick a decision per row (click again to clear). Rows left <strong>Unreviewed</strong>{' '}
            are skipped. “Create GitHub issue” opens one issue for all decisions; then run the{' '}
            <strong>Cursor override automation</strong> workflow manually to get a PR.
          </p>
          <ul className="mt-2 list-inside list-disc">
            {(
              Object.entries(AUDIT_DECISION_HELP) as [keyof typeof AUDIT_DECISION_HELP, string][]
            ).map(([decision, help]) => (
              <li key={decision}>
                <strong>{AUDIT_DECISION_LABELS[decision]}</strong> — {help}
              </li>
            ))}
          </ul>
        </details>
      </header>

      <AuditSchemaRefreshBanner />

      {actionableCount === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No unreviewed or stale entries for this audit.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            try {
              const issueUrl = buildBatchSchemaOverrideIssueUrl({
                kind: slug,
                slug,
                entries,
                decisions: form.state.values.decisions,
                dataUrl: dataUrl ?? '',
                reference,
              })
              window.open(issueUrl, '_blank', 'noopener,noreferrer')
            } catch (error) {
              window.alert(error instanceof Error ? error.message : 'Could not build issue URL.')
            }
          }}
          className="space-y-4"
        >
          <form.Subscribe selector={(state) => state.values.decisions}>
            {(decisions) => {
              const issueCount = entries.filter((entry) =>
                auditDecisionIncludesIssue(decisions[entry.entryId] ?? 'pending'),
              ).length
              return (
                <>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full table-fixed text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                        <tr>
                          <th className="w-[14%] px-3 py-2">Preset</th>
                          <th className="w-[34%] px-3 py-2">Details</th>
                          <th className="w-[10%] px-3 py-2">Status</th>
                          <th className="w-[42%] px-3 py-2">Decision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {presetGroups.flatMap((group, groupIndex) =>
                          group.entries.map((entry, entryIndex) => (
                            <AuditEntryRow
                              key={entry.entryId}
                              entry={entry}
                              selected={selected === entry.entryId}
                              decision={decisions[entry.entryId] ?? 'pending'}
                              onDecisionChange={(value) => {
                                form.setFieldValue('decisions', {
                                  ...decisions,
                                  [entry.entryId]: value,
                                })
                              }}
                              showPresetCell={entryIndex === 0}
                              presetRowSpan={group.entries.length}
                              presetGroupStart={groupIndex > 0 && entryIndex === 0}
                            />
                          )),
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 py-3 backdrop-blur">
                    <button
                      type="submit"
                      disabled={issueCount === 0}
                      className={cn(
                        externalActionPillClass('border border-mauve-200 bg-mauve-50/80'),
                        issueCount === 0 && 'cursor-not-allowed opacity-50',
                      )}
                      data-testid="audit-create-issue"
                    >
                      Create GitHub issue ({issueCount}) ↗
                    </button>
                    <Link
                      to="/audits"
                      search={(prev) => ({
                        dataUrl: prev.dataUrl ?? '',
                        locale: prev.locale ?? '',
                        reference: prev.reference,
                      })}
                      className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                    >
                      All audits
                    </Link>
                    <Link
                      to="/"
                      search={(prev) => ({
                        ...presetSearchDefaults,
                        dataUrl: prev.dataUrl ?? '',
                        locale: prev.locale ?? '',
                      })}
                      className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
                    >
                      Presets
                    </Link>
                  </div>
                </>
              )
            }}
          </form.Subscribe>
        </form>
      )}
    </div>
  )
}
