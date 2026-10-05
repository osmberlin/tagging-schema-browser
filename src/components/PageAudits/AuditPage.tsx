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
  type AuditLabelPair,
} from '@/components/PageAudits/auditEntries'
import {
  AuditSchemaLoadingPanel,
  AuditSchemaRefreshBanner,
} from '@/components/PageAudits/AuditSchemaStatus'
import { AUDIT_META, isAuditSlug } from '@/components/PageAudits/auditSlugs'
import { tryBuildBatchSchemaOverrideIssueUrl } from '@/components/PageAudits/buildBatchOverrideIssueUrl'
import { fieldListTitle } from '@/components/PageAudits/fieldListTitle'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { LabelDiff, LabelMismatchKindPill } from '@/components/ui/LabelDiff'
import { useSchemaIssueDisclosureActions } from '@/features/schema-issue/schema-issue-disclosure-store'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { fieldOptionTitle } from '@/utils/fieldOptionTranslation'
import { diffLabelWords } from '@/utils/labelMismatch'
import { osmWikiUrlForTag } from '@/utils/osmWikiUrl'
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
  locked = false,
}: {
  options: FieldDecision[]
  value: FieldDecision | undefined
  onChange: (value: FieldDecision | undefined) => void
  label: string
  /** Issue URL is too long: only the active option (to clear it) stays clickable. */
  locked?: boolean
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
            disabled={locked && !active}
            title={
              locked && !active
                ? 'Issue is too long — clear a decision first, or review the rest in a follow-up issue.'
                : FIELD_DECISION_HELP[option]
            }
            onClick={() => onChange(active ? undefined : option)}
            className={cn(
              'px-2.5 py-1 whitespace-nowrap transition-colors not-first:border-l not-first:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40',
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

/** Opens the "Option ≠ preset name" disclosure on the page a link leads to. */
function useOpenLabelDisclosure() {
  const { setOpen } = useSchemaIssueDisclosureActions()
  return (kind: 'field' | 'preset', id: string) => setOpen(`${kind}-label-mismatch:${id}`, true)
}

const labelColumnsClass =
  'grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_1rem_minmax(0,1fr)_7.5rem] gap-x-2'

/**
 * One option of the field (left) and the preset that option leads to (right), each linking to
 * its own page. `diff` marks the words that differ; without it the two labels read the same.
 */
function LabelPairLine({
  fieldId,
  fieldKey,
  pair,
  matches = false,
}: {
  fieldId: string
  fieldKey: string
  pair: AuditLabelPair
  matches?: boolean
}) {
  const { fieldTranslations } = useSchema()
  const fieldLabel = fieldTranslations[fieldId]?.label
  const openDisclosure = useOpenLabelDisclosure()
  const diff = diffLabelWords(pair.optionLabel, pair.childPresetName)
  const nameClass = 'underline decoration-slate-300 underline-offset-2 hover:text-sky-700'
  return (
    <div className="min-w-0 flex-1">
      <div className={cn(labelColumnsClass, 'text-sm text-slate-900')}>
        <div className="min-w-0">
          {fieldLabel ? <span className="text-slate-500">{fieldLabel}: </span> : null}
          <Link
            to="/field/$"
            params={{ _splat: fieldId }}
            search={keepDataSource}
            onClick={() => openDisclosure('field', fieldId)}
            title={`Option label, from the strings of field ${fieldId}`}
            className={nameClass}
          >
            {matches ? pair.optionLabel : <LabelDiff parts={diff.left} />}
          </Link>
          <Truncated
            text={`${fieldKey}=${pair.optionValue}`}
            className="font-mono text-xs text-slate-500"
          />
        </div>
        <span className="text-slate-400" aria-label={matches ? 'same as' : 'differs from'}>
          {matches ? '=' : '≠'}
        </span>
        <div className="min-w-0">
          <Link
            to="/preset/$"
            params={{ _splat: pair.childPresetId }}
            search={keepDataSource}
            onClick={() => openDisclosure('preset', pair.childPresetId)}
            title={`Preset name of ${pair.childPresetId}`}
            className={nameClass}
          >
            {matches ? pair.childPresetName : <LabelDiff parts={diff.right} />}
          </Link>
          <Truncated
            text={pair.childPresetId}
            fromStart
            className="font-mono text-xs text-slate-500"
          />
        </div>
        <span className="flex items-start justify-end pt-0.5">
          {pair.kind && !matches ? <LabelMismatchKindPill kind={pair.kind} /> : null}
        </span>
      </div>
      {pair.previous ? (
        <p className="text-xs text-amber-700">
          Renamed since the last review (“{pair.previous.optionLabel}” ≠ “{pair.previous.presetName}
          ”).
        </p>
      ) : null}
    </div>
  )
}

/**
 * The field as a mapper meets it in iD: its label on top, the input below (placeholder, or the
 * first options when there is none). An option label only makes sense read under that label.
 */
function LabelEntryHeader({ entry }: { entry: AuditEntry }) {
  const { fields, fieldTranslations } = useSchema()
  const openDisclosure = useOpenLabelDisclosure()
  const fieldId = entry.optionFieldId!
  const field = fields[fieldId]
  const strings = fieldTranslations[fieldId]
  const optionLabels = Object.values(strings?.options ?? {})
    .map((option) => fieldOptionTitle(option))
    .filter((label): label is string => Boolean(label))
  const preview = optionLabels.slice(0, 4).join(', ')

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div
          className="w-64 max-w-full overflow-hidden rounded border border-slate-300 text-sm"
          title="How iD shows this field: label on top, input below"
        >
          <div className="bg-slate-100 px-2 py-1 font-semibold text-slate-900">
            {strings?.label ?? fieldId}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-300 bg-white px-2 py-1 text-slate-400">
            <span className="truncate">
              {strings?.placeholder ?? (preview ? `${preview}…` : 'Unknown')}
            </span>
            <span aria-hidden>▾</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Field{' '}
          <Link
            to="/field/$"
            params={{ _splat: fieldId }}
            search={keepDataSource}
            onClick={() => openDisclosure('field', fieldId)}
            className={cn('font-mono', linkClass)}
          >
            {fieldId}
          </Link>{' '}
          of this preset
          <br />
          type <span className="font-mono">{field?.type ?? 'unknown'}</span>
          {strings?.placeholder ? null : ', no placeholder'}
        </p>
      </div>
      <div className="flex gap-3 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
        <div className={labelColumnsClass}>
          <span>Option of “{strings?.label ?? fieldId}”</span>
          <span />
          <span>Preset the option leads to</span>
          <span />
        </div>
        {/* Keeps the captions aligned with the lines, which end in decision buttons. */}
        <span className="invisible shrink-0 px-2.5 text-xs normal-case" aria-hidden>
          OK to skip Fix upstream
        </span>
      </div>
    </div>
  )
}

/** The remaining options of the field that lead to a preset: same label, or already accepted. */
function LabelEntryOtherOptions({ entry, fieldKey }: { entry: AuditEntry; fieldKey: string }) {
  const { data } = useSchema()
  const fieldId = entry.optionFieldId!
  const open = new Set(entry.fields.map((field) => field.labelPair?.optionValue))
  const rows = (data?.indices.fieldOptionMismatchRows.get(fieldId) ?? []).filter(
    (row) => row.parentPreset.id === entry.presetId && !open.has(row.optionValue),
  )
  if (rows.length === 0) return null

  const accepted = rows.filter((row) => row.labelMismatch).length
  const same = rows.length - accepted
  const summary = [
    same > 0 ? `${same} with the same label` : '',
    accepted > 0 ? `${accepted} accepted as OK to skip` : '',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <details className="text-xs text-slate-500">
      <summary className="cursor-pointer hover:text-slate-900">
        Other options of this field that lead to a preset: {summary}
      </summary>
      <ul className="mt-2 space-y-1">
        {rows.map((row) => (
          <li key={row.optionValue} className="flex items-center gap-3">
            <LabelPairLine
              fieldId={fieldId}
              fieldKey={fieldKey}
              matches={!row.labelMismatch}
              pair={{
                optionValue: row.optionValue,
                childPresetId: row.childPreset.id,
                optionLabel: row.labelEn,
                childPresetName: row.childPreset.name,
              }}
            />
            <span className="w-40 shrink-0 text-right">
              {row.labelMismatch ? 'OK to skip (accepted)' : 'same label'}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

type FieldGroup = { key: string; title: string; state: AuditFieldState; fields: AuditField[] }

function fieldGroupTitle(entry: AuditEntry, state: AuditFieldState): string {
  if (state === 'stale') {
    return entry.kind === 'label-mismatch'
      ? 'Outdated override entries (labels match now, or the option lost its preset)'
      : 'Outdated override entries (no longer detected)'
  }
  if (entry.kind === 'risky-typecombo') return 'typeCombo fields that can write key=yes'
  if (entry.kind === 'label-mismatch') return 'Options labelled differently than their preset'
  return `${fieldListTitle(entry.listKey!)} of the parent that are not inherited`
}

/** Items of one entry: what needs a decision, then outdated override entries. */
function fieldGroups(entry: AuditEntry): FieldGroup[] {
  return (['missing', 'stale'] as const)
    .map((state) => ({
      key: state,
      title: fieldGroupTitle(entry, state),
      state,
      fields: entry.fields.filter((field) => field.state === state),
    }))
    .filter((group) => group.fields.length > 0)
}

function EntryFields({
  entry,
  decisions,
  setDecisions,
  locked,
}: {
  entry: AuditEntry
  decisions: Decisions
  locked: boolean
  setDecisions: (updates: Decisions) => void
}) {
  const keyOf = (field: AuditField) => fieldDecisionKey(entry.entryId, field.fieldId)
  const groups = fieldGroups(entry)
  const { fields: schemaFields } = useSchema()
  const optionFieldKey = schemaFields[entry.optionFieldId ?? '']?.key ?? entry.optionFieldId ?? ''

  return (
    <div className="space-y-4">
      {entry.optionFieldId ? <LabelEntryHeader entry={entry} /> : null}
      {groups.map(({ key, title, state, fields }) => {
        const options = FIELD_DECISIONS_BY_STATE[state]
        const first = decisions[keyOf(fields[0]!)]
        const allSame = fields.every((field) => decisions[keyOf(field)] === first)
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-1">
              <p className="min-w-0 flex-1 text-xs font-semibold text-slate-600">{title}</p>
              {fields.length > 1 ? <span className="text-xs text-slate-500">All:</span> : null}
              {fields.length > 1 ? (
                <DecisionButtons
                  label={`Decision for all of “${title}” in ${entry.entryId}`}
                  locked={locked}
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
                  {field.labelPair ? (
                    <LabelPairLine
                      fieldId={entry.optionFieldId!}
                      fieldKey={optionFieldKey}
                      pair={field.labelPair}
                    />
                  ) : (
                    <FieldLink field={field} />
                  )}
                  <DecisionButtons
                    label={`Decision for ${field.fieldId}`}
                    locked={locked}
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
      {entry.optionFieldId ? (
        <LabelEntryOtherOptions entry={entry} fieldKey={optionFieldKey} />
      ) : entry.documentedFieldIds.length > 0 ? (
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

/** Preset name (link) with its id below, plus a wiki link opening in a new tab; used for the preset and its parent. */
function PresetCell({ presetId, presetName }: { presetId: string; presetName: string }) {
  const { presetsById } = useSchema()
  const preset = presetsById.get(presetId)
  const wikiRef =
    preset?.reference ??
    (preset?.primaryTagKey
      ? { key: preset.primaryTagKey, value: preset.primaryTagValue }
      : undefined)

  return (
    <>
      <Link
        to="/preset/$"
        params={{ _splat: presetId }}
        search={keepDataSource}
        className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-sky-700"
      >
        <Truncated text={presetName} />
      </Link>
      <Truncated text={presetId} fromStart className="font-mono text-xs text-slate-500" />
      {wikiRef ? (
        <a
          href={osmWikiUrlForTag(wikiRef.key, wikiRef.value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-700 underline decoration-sky-200 underline-offset-2 hover:text-sky-800"
          title={`OSM Wiki: ${wikiRef.value ? `${wikiRef.key}=${wikiRef.value}` : wikiRef.key}`}
        >
          Wiki ↗
        </a>
      ) : null}
    </>
  )
}

/** One table row per preset + parent; its field lists (fields / moreFields) stack in the Fields cell. */
function AuditRow({
  entries,
  selected,
  children,
}: {
  entries: AuditEntry[]
  selected: boolean
  children: React.ReactNode
}) {
  const rowRef = useRef<HTMLTableRowElement>(null)
  const first = entries[0]!

  useEffect(
    function scrollSelectedAuditRowIntoView() {
      if (selected) rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    },
    [selected],
  )

  return (
    <tr
      ref={rowRef}
      className={cn('border-t border-slate-200 align-top', selected && 'bg-amber-50/80')}
    >
      <td className="px-3 py-3">
        <PresetCell presetId={first.presetId} presetName={first.presetName} />
      </td>
      {first.kind === 'missing-inheritance' ? (
        <td className="px-3 py-3">
          <PresetCell presetId={first.parentId!} presetName={first.parentName!} />
        </td>
      ) : null}
      <td className="space-y-5 px-3 py-3">{children}</td>
    </tr>
  )
}

export function AuditDetailPage() {
  const { slug: slugParam } = useParams({ strict: false })
  const slug = slugParam && isAuditSlug(slugParam) ? slugParam : null
  const { selected } = useSearch({ strict: false, select: (raw) => auditSearchSchema.parse(raw) })
  const { presets, data, dataUrl, reference, loading } = useSchema()

  const entries = useMemo(
    () => (slug && data ? auditEntriesForSlug(slug, presets, data.indices.labelMismatchPairs) : []),
    [slug, data, presets],
  )

  const rows = useMemo(() => {
    const byKey = new Map<string, AuditEntry[]>()
    for (const entry of entries) {
      const key = `${entry.presetId}|${entry.parentId ?? ''}`
      byKey.set(key, [...(byKey.get(key) ?? []), entry])
    }
    return [...byKey.entries()]
  }, [entries])

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
          <CountPill className="text-sm">{rows.length}</CountPill>
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
          {slug === 'label-mismatch' ? (
            <p className="mt-2">
              A field like “Cuisines” on the Restaurant preset offers options (“Pizza”). The box
              above each list shows the field the way iD does, label first, because an option is
              always read under that label (“Sells Used: Only”). Some options have a preset of their
              own (“Pizza Restaurant”) that iD switches to. Each line shows the option label on the
              left and the name of that preset on the right, both in English as shipped in the
              schema; the words that differ are marked. “One label extends the other” is mostly
              wanted (the preset name repeats the feature type), “Different wording” is where
              renames drift apart. Decisions are stored with both labels, so a pair returns here
              when one of them is renamed.
            </p>
          ) : null}
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
            const issue =
              decidedCount === 0
                ? undefined
                : tryBuildBatchSchemaOverrideIssueUrl({
                    slug,
                    entries,
                    decisions,
                    dataUrl: dataUrl ?? '',
                    reference,
                  })
            const issueError = issue && 'error' in issue ? issue.error : undefined

            return (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  if (issue && 'url' in issue) {
                    window.open(issue.url, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                <div className="overflow-x-auto rounded-t-xl border border-slate-200">
                  <table className="w-full min-w-[40rem] table-fixed text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                      <tr>
                        <th className="w-[22%] px-3 py-2">Preset</th>
                        {hasParentColumn ? <th className="w-[16%] px-3 py-2">Parent</th> : null}
                        <th className="px-3 py-2">
                          {slug === 'label-mismatch'
                            ? 'Field options that lead to a differently named preset'
                            : 'Fields'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(([key, rowEntries]) => (
                        <AuditRow
                          key={key}
                          entries={rowEntries}
                          selected={rowEntries.some((entry) => entry.entryId === selected)}
                        >
                          {rowEntries.map((entry) => (
                            <div key={entry.entryId} data-audit-entry={entry.entryId}>
                              <EntryFields
                                entry={entry}
                                decisions={decisions}
                                setDecisions={setDecisions}
                                locked={issueError !== undefined}
                              />
                            </div>
                          ))}
                        </AuditRow>
                      ))}
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
                  {issueError ? (
                    <span
                      role="alert"
                      className="text-amber-300"
                      data-testid="audit-issue-too-long"
                    >
                      {issueError} New decisions are disabled. Clear some decisions to enable
                      submitting, then review the rest in a follow-up issue.
                    </span>
                  ) : null}
                  <button
                    type="submit"
                    disabled={decidedCount === 0 || issueError !== undefined}
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
