import { useForm } from '@tanstack/react-form'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useRef } from 'react'
import { z } from 'zod'
import {
  FIELD_DECISION_HELP,
  FIELD_DECISION_LABELS,
  FIELD_DECISIONS_BY_STATE,
  fieldDecisionKey,
  type AuditFieldState,
  type FieldDecision,
} from '@/components/PageAudits/auditDecisions'
import {
  auditEntriesForSlug,
  type AuditEntry,
  type AuditField,
} from '@/components/PageAudits/auditEntries'
import {
  AuditSchemaLoadingPanel,
  AuditSchemaRefreshBanner,
} from '@/components/PageAudits/AuditSchemaStatus'
import { AUDIT_META, isAuditSlug } from '@/components/PageAudits/auditSlugs'
import { buildBatchSchemaOverrideIssueUrl } from '@/components/PageAudits/buildBatchOverrideIssueUrl'
import { fieldListTitle } from '@/components/PageAudits/fieldListTitle'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'

/** Keep data source + locale when linking to preset/field detail pages. */
const keepDataSource = (prev: { dataUrl?: string; locale?: string }) => ({
  dataUrl: prev.dataUrl ?? '',
  locale: prev.locale ?? '',
})

const auditSearchSchema = z.object({
  selected: z.string().catch(''),
})

type Decisions = Record<string, FieldDecision | undefined>

const DECISION_ACTIVE_CLASS: Record<FieldDecision, string> = {
  intentional: 'bg-emerald-600 text-white',
  needs_work: 'bg-amber-500 text-white',
  remove: 'bg-rose-600 text-white',
}

const linkClass = 'text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900'

/**
 * Single-line text that truncates with "…" and shows the full value on hover.
 * `fromStart` cuts the beginning instead, so ids with a shared prefix stay distinguishable.
 */
function Truncated({
  text,
  className,
  fromStart = false,
}: {
  text: string
  className?: string
  fromStart?: boolean
}) {
  return (
    <span
      className={cn('block truncate', fromStart && 'text-left [direction:rtl]', className)}
      title={text}
    >
      {/* LRM marks keep punctuation in place inside the rtl box. */}
      {fromStart ? `\u200E${text}\u200E` : text}
    </span>
  )
}

/** Segmented button group. Clicking the active option clears it. */
function DecisionButtons({
  options,
  value,
  onChange,
  label,
}: {
  options: FieldDecision[]
  value: FieldDecision | undefined
  onChange: (value: FieldDecision | undefined) => void
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 overflow-hidden rounded-md text-xs font-medium ring-1 ring-slate-300"
    >
      {options.map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            title={FIELD_DECISION_HELP[option]}
            onClick={() => onChange(active ? undefined : option)}
            className={cn(
              'px-2.5 py-1 whitespace-nowrap transition-colors not-first:border-l not-first:border-slate-300',
              active ? DECISION_ACTIVE_CLASS[option] : 'bg-white text-slate-700 hover:bg-slate-100',
            )}
          >
            {FIELD_DECISION_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}

function FieldLink({ field }: { field: AuditField }) {
  return (
    <div className="min-w-0 flex-1">
      <Link
        to="/field/$"
        params={{ _splat: field.fieldId }}
        search={keepDataSource}
        className={cn('font-mono text-xs', linkClass)}
      >
        <Truncated text={field.fieldId} fromStart />
      </Link>
      {field.fieldKey ? (
        <Truncated
          text={`empty typeCombo can write ${field.fieldKey}=yes`}
          className="text-xs text-slate-500"
        />
      ) : null}
    </div>
  )
}

function fieldGroupTitle(entry: AuditEntry, state: AuditFieldState): string {
  if (state === 'stale') return 'Outdated override entries (no longer detected)'
  if (entry.kind === 'risky-typecombo') return 'typeCombo fields that can write key=yes'
  return `${fieldListTitle(entry.listKey!)} of the parent that are not inherited`
}

function EntryFields({
  entry,
  decisions,
  setDecisions,
}: {
  entry: AuditEntry
  decisions: Decisions
  setDecisions: (updates: Decisions) => void
}) {
  const keyOf = (field: AuditField) => fieldDecisionKey(entry.entryId, field.fieldId)
  const groups = (['missing', 'stale'] as const)
    .map((state) => ({ state, fields: entry.fields.filter((field) => field.state === state) }))
    .filter((group) => group.fields.length > 0)

  return (
    <div className="space-y-4">
      {groups.map(({ state, fields }) => {
        const options = FIELD_DECISIONS_BY_STATE[state]
        const first = decisions[keyOf(fields[0]!)]
        const allSame = fields.every((field) => decisions[keyOf(field)] === first)
        return (
          <div key={state} className="space-y-1">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-1">
              <p className="min-w-0 flex-1 text-xs font-semibold text-slate-600">
                {fieldGroupTitle(entry, state)}
              </p>
              {fields.length > 1 ? <span className="text-xs text-slate-500">All:</span> : null}
              {fields.length > 1 ? (
                <DecisionButtons
                  label={`Decision for all fields of ${entry.entryId}`}
                  options={options}
                  value={allSame ? first : undefined}
                  onChange={(value) =>
                    setDecisions(Object.fromEntries(fields.map((field) => [keyOf(field), value])))
                  }
                />
              ) : null}
            </div>
            <ul className="space-y-1">
              {fields.map((field) => (
                <li key={field.fieldId} className="flex items-center gap-3">
                  <FieldLink field={field} />
                  <DecisionButtons
                    label={`Decision for ${field.fieldId}`}
                    options={options}
                    value={decisions[keyOf(field)]}
                    onChange={(value) => setDecisions({ [keyOf(field)]: value })}
                  />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {entry.documentedFieldIds.length > 0 ? (
        <p className="text-xs text-slate-500">
          Already OK to skip:{' '}
          <span className="font-mono">{entry.documentedFieldIds.join(', ')}</span>
        </p>
      ) : null}
      {entry.explicitPresetRefs.length > 0 ? (
        <p className="text-xs text-slate-500">
          Other preset refs:{' '}
          <span className="font-mono">{entry.explicitPresetRefs.join(', ')}</span>
        </p>
      ) : null}
    </div>
  )
}

function PresetLink({ presetId, className }: { presetId: string; className?: string }) {
  return (
    <Link
      to="/preset/$"
      params={{ _splat: presetId }}
      search={keepDataSource}
      className={className}
    >
      <Truncated text={presetId} fromStart />
    </Link>
  )
}

function AuditEntryRow({
  entry,
  selected,
  presetRowSpan,
  groupStart,
  children,
}: {
  entry: AuditEntry
  selected: boolean
  /** 0 = preset cell is rendered by an earlier row of the same preset. */
  presetRowSpan: number
  groupStart: boolean
  children: React.ReactNode
}) {
  const rowRef = useRef<HTMLTableRowElement>(null)

  useEffect(
    function scrollSelectedAuditRowIntoView() {
      if (selected) rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    },
    [selected],
  )

  return (
    <tr
      ref={rowRef}
      data-audit-entry={entry.entryId}
      className={cn(
        'align-top',
        groupStart ? 'border-t-2 border-slate-200' : 'border-t border-slate-100',
        selected && 'bg-amber-50/80',
      )}
    >
      {presetRowSpan > 0 ? (
        <td className="px-3 py-3" rowSpan={presetRowSpan}>
          <Link
            to="/preset/$"
            params={{ _splat: entry.presetId }}
            search={keepDataSource}
            className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-sky-700"
          >
            <Truncated text={entry.presetName} />
          </Link>
          <Truncated text={entry.presetId} fromStart className="font-mono text-xs text-slate-500" />
        </td>
      ) : null}
      {entry.kind === 'missing-inheritance' ? (
        <td className="px-3 py-3">
          <PresetLink presetId={entry.parentId!} className={cn('font-mono text-xs', linkClass)} />
        </td>
      ) : null}
      <td className="px-3 py-3">{children}</td>
    </tr>
  )
}

export function AuditDetailPage() {
  const { slug: slugParam } = useParams({ strict: false })
  const slug = slugParam && isAuditSlug(slugParam) ? slugParam : null
  const { selected } = useSearch({ strict: false, select: (raw) => auditSearchSchema.parse(raw) })
  const { presets, data, dataUrl, reference, loading } = useSchema()

  const entries = useMemo(
    () => (slug && data ? auditEntriesForSlug(slug, presets) : []),
    [slug, data, presets],
  )

  const form = useForm({ defaultValues: { decisions: {} as Decisions } })

  useEffect(
    function resetDecisionsWhenSlugChanges() {
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

  const hasParentColumn = slug === 'missing-inheritance'

  return (
    <div className="space-y-4">
      <header className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          <AreaIcon area={meta.area} className={`h-7 w-7 ${areaAccent[meta.area].icon}`} />
          Audit: {meta.title}
          <CountPill className="text-sm">{entries.length}</CountPill>
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">{meta.description}</p>
        <details className="max-w-3xl text-sm text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900">
            How does this work?
          </summary>
          <p className="mt-2">
            Decide per field, or use the buttons in a group header to decide all fields at once
            (click an active button again to clear). Undecided fields are left out. “Create GitHub
            issue” opens one issue with all decisions; submitting it runs a workflow that updates{' '}
            <code>{meta.overrideFile}</code> and opens a PR.
          </p>
          <ul className="mt-2 list-inside list-disc">
            {(Object.keys(FIELD_DECISION_HELP) as FieldDecision[]).map((decision) => (
              <li key={decision}>
                <strong>{FIELD_DECISION_LABELS[decision]}</strong> — {FIELD_DECISION_HELP[decision]}
              </li>
            ))}
          </ul>
        </details>
      </header>

      <AuditSchemaRefreshBanner />

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Nothing left to review for this audit.
        </p>
      ) : (
        <form.Subscribe selector={(state) => state.values.decisions}>
          {(decisions) => {
            const setDecisions = (updates: Decisions) =>
              form.setFieldValue('decisions', { ...decisions, ...updates })
            const counts = { intentional: 0, needs_work: 0, remove: 0 }
            for (const entry of entries) {
              for (const field of entry.fields) {
                const decision = decisions[fieldDecisionKey(entry.entryId, field.fieldId)]
                if (decision) counts[decision] += 1
              }
            }
            const decidedCount = counts.intentional + counts.needs_work + counts.remove

            return (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  try {
                    const issueUrl = buildBatchSchemaOverrideIssueUrl({
                      slug,
                      entries,
                      decisions,
                      dataUrl: dataUrl ?? '',
                      reference,
                    })
                    window.open(issueUrl, '_blank', 'noopener,noreferrer')
                  } catch (error) {
                    window.alert(
                      error instanceof Error ? error.message : 'Could not build issue URL.',
                    )
                  }
                }}
              >
                <div className="overflow-x-auto rounded-t-xl border border-slate-200">
                  <table className="w-full min-w-[40rem] table-fixed text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                      <tr>
                        <th className="w-[22%] px-3 py-2">Preset</th>
                        {hasParentColumn ? <th className="w-[16%] px-3 py-2">Parent</th> : null}
                        <th className="px-3 py-2">Fields</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, index) => {
                        const previous = entries[index - 1]
                        const groupStart = previous?.presetId !== entry.presetId
                        const presetRowSpan = groupStart
                          ? entries.slice(index).findIndex((e) => e.presetId !== entry.presetId)
                          : 0
                        return (
                          <AuditEntryRow
                            key={entry.entryId}
                            entry={entry}
                            selected={selected === entry.entryId}
                            presetRowSpan={
                              presetRowSpan === -1 ? entries.length - index : presetRowSpan
                            }
                            groupStart={groupStart && index > 0}
                          >
                            <EntryFields
                              entry={entry}
                              decisions={decisions}
                              setDecisions={setDecisions}
                            />
                          </AuditEntryRow>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-xl bg-slate-900 px-4 py-3 text-sm text-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
                  <span>
                    {decidedCount === 0
                      ? 'No decisions yet'
                      : (Object.keys(counts) as FieldDecision[])
                          .filter((decision) => counts[decision] > 0)
                          .map(
                            (decision) => `${counts[decision]} ${FIELD_DECISION_LABELS[decision]}`,
                          )
                          .join(' · ')}
                  </span>
                  <button
                    type="submit"
                    disabled={decidedCount === 0}
                    data-testid="audit-create-issue"
                    className="ml-auto rounded-md bg-white px-3 py-1.5 font-semibold text-slate-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Create GitHub issue ↗
                  </button>
                </div>
              </form>
            )
          }}
        </form.Subscribe>
      )}
    </div>
  )
}
