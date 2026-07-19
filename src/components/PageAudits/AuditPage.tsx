import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useRef } from 'react'
import { z } from 'zod'
import {
  auditEntriesForSlug,
  auditEntryNeedsAction,
  defaultAuditDecision,
  type AuditDecision,
  type AuditEntry,
} from '@/components/PageAudits/auditEntries'
import { AUDIT_META, auditSlugToKind, isAuditSlug } from '@/components/PageAudits/auditSlugs'
import { buildBatchSchemaOverrideIssueUrl } from '@/components/PageAudits/buildBatchOverrideIssueUrl'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { externalActionPillClass } from '@/theme/externalAccent'
import { cn } from '@/utils/tw'

const auditSearchSchema = z.object({
  selected: z.string().catch(''),
})

type AuditFormValues = {
  decisions: Record<string, AuditDecision>
}

const DECISION_OPTIONS: { value: AuditDecision; label: string }[] = [
  { value: 'pending', label: 'Unreviewed' },
  { value: 'intentional', label: 'Intentional (false positive)' },
  { value: 'remove_stale', label: 'Remove stale override' },
  { value: 'needs_work', label: 'Needs upstream work' },
]

function decisionLabel(entry: AuditEntry, decision: AuditDecision): string {
  if (entry.status === 'stale' && decision === 'pending') return 'Stale (choose action)'
  return DECISION_OPTIONS.find((option) => option.value === decision)?.label ?? decision
}

function AuditEntryRow({
  entry,
  selected,
  decision,
  onDecisionChange,
}: {
  entry: AuditEntry
  selected: boolean
  decision: AuditDecision
  onDecisionChange: (decision: AuditDecision) => void
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
        selected && 'bg-amber-50/80 ring-1 ring-amber-200 ring-inset',
      )}
    >
      <td className="px-3 py-3">
        <div className="space-y-1">
          <Link
            to="/preset/$"
            params={{ _splat: entry.presetId }}
            search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
            className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-sky-700"
          >
            {entry.presetName}
          </Link>
          <p className="font-mono text-xs text-slate-500">{entry.presetId}</p>
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-slate-700">
        {entry.kind === 'missing-inheritance' ? (
          <div className="space-y-2">
            <p>
              List <code className="font-mono text-xs">{entry.fieldListKey}</code> — parent{' '}
              <Link
                to="/preset/$"
                params={{ _splat: entry.parentId }}
                search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                className="font-mono text-xs text-sky-700 underline underline-offset-2"
              >
                {entry.parentId}
              </Link>
            </p>
            <p className="text-xs text-slate-500">Missing field ids:</p>
            <ul className="list-inside list-disc font-mono text-xs text-slate-800">
              {entry.missedFieldIds.map((fieldId) => (
                <li key={fieldId}>
                  <Link
                    to="/field/$"
                    params={{ _splat: fieldId }}
                    search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                    className="text-sky-700 underline underline-offset-2"
                  >
                    {fieldId}
                  </Link>
                </li>
              ))}
            </ul>
            {entry.explicitPresetRefs.length > 0 ? (
              <p className="text-xs text-slate-500">
                Other preset refs: {entry.explicitPresetRefs.join(', ')}
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-1 text-sm">
            {entry.riskyTypeCombo.fields.map((field) => (
              <li key={`${field.fieldId}:${field.listKey}`}>
                <Link
                  to="/field/$"
                  params={{ _splat: field.fieldId }}
                  search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                  className="font-mono text-xs text-sky-700 underline underline-offset-2"
                >
                  {field.fieldId}
                </Link>{' '}
                <span className="text-slate-500">
                  (<code>{field.fieldKey}</code>, {field.listKey})
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
      <td className="px-3 py-3">
        <select
          value={decision}
          onChange={(event) => onDecisionChange(event.target.value as AuditDecision)}
          aria-label={`Decision for ${entry.presetId}`}
          className="w-full min-w-[12rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm"
        >
          {DECISION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {decisionLabel(entry, option.value)}
            </option>
          ))}
        </select>
      </td>
    </tr>
  )
}

export function AuditDetailPage() {
  const { _splat: slugParam } = useParams({ strict: false })
  const slug = slugParam && isAuditSlug(slugParam) ? slugParam : null
  const { selected } = useSearch({ strict: false, select: (raw) => auditSearchSchema.parse(raw) })
  const { presets, data, dataUrl, loading } = useSchema()

  const entries = useMemo(() => {
    if (!slug || !data) return []
    return auditEntriesForSlug(slug, presets).filter(auditEntryNeedsAction)
  }, [slug, data, presets])

  const defaultDecisions = useMemo(() => {
    const decisions: Record<string, AuditDecision> = {}
    for (const entry of entries) {
      decisions[entry.entryId] = defaultAuditDecision(entry)
    }
    return decisions
  }, [entries])

  const form = useForm({
    defaultValues: { decisions: defaultDecisions } satisfies AuditFormValues,
  })

  useEffect(
    function resetAuditFormWhenEntriesChange() {
      form.reset({ decisions: defaultDecisions })
    },
    [defaultDecisions, form],
  )

  if (!slug) {
    return <p className="text-sm text-slate-600">Unknown audit.</p>
  }

  const meta = AUDIT_META[slug]

  if (loading && !data) {
    return <SchemaLoadingPanel label="Loading schema…" />
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
        <p className="text-sm text-slate-500">
          Mark each row, then open one GitHub issue for the selected overrides. Run the{' '}
          <strong>Cursor override automation</strong> workflow manually when you are ready for a PR.
        </p>
      </header>

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
                kind: auditSlugToKind(slug),
                slug,
                entries,
                decisions: form.state.values.decisions,
                dataUrl: dataUrl ?? '',
              })
              window.open(issueUrl, '_blank', 'noopener,noreferrer')
            } catch (error) {
              window.alert(error instanceof Error ? error.message : 'Could not build issue URL.')
            }
          }}
          className="space-y-4"
        >
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Preset</th>
                  <th className="px-3 py-2">Details</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Decision</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <AuditEntryRow
                    key={entry.entryId}
                    entry={entry}
                    selected={selected === entry.entryId}
                    decision={
                      form.state.values.decisions[entry.entryId] ?? defaultAuditDecision(entry)
                    }
                    onDecisionChange={(value) => {
                      form.setFieldValue('decisions', {
                        ...form.state.values.decisions,
                        [entry.entryId]: value,
                      })
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className={externalActionPillClass('border border-mauve-200 bg-mauve-50/80')}
              data-testid="audit-create-issue"
            >
              Create GitHub issue ↗
            </button>
            <Link
              to="/"
              search={(prev) => ({
                ...presetSearchDefaults,
                dataUrl: prev.dataUrl ?? '',
                locale: prev.locale ?? '',
              })}
              className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
            >
              Back to presets
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

export function AuditsIndexRedirect() {
  return (
    <Navigate
      to="/"
      search={(prev) => ({
        ...presetSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      })}
      replace
    />
  )
}
