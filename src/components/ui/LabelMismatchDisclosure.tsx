import { Link } from '@tanstack/react-router'
import { auditPageHref } from '@/components/PageAudits/auditPageHref'
import { AreaIcon } from '@/components/ui/areaIcons'
import { AreaLink } from '@/components/ui/AreaLink'
import { LabelDiff, LabelMismatchKindPill } from '@/components/ui/LabelDiff'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { useSchema } from '@/hooks/useSchema'
import { schemaIssueStyles } from '@/theme/schemaIssue'
import { diffLabelWords, type LabelMismatchPair } from '@/utils/labelMismatch'
import { cn } from '@/utils/tw'

const keepDataSource = (prev: { dataUrl?: string; locale?: string }) => ({
  dataUrl: prev.dataUrl ?? '',
  locale: prev.locale ?? '',
})

function PresetLink({ presetId, children }: { presetId: string; children: React.ReactNode }) {
  return (
    <Link
      to="/preset/$"
      params={{ _splat: presetId }}
      search={keepDataSource}
      className={cn(schemaIssueStyles.disclosureActionLink, schemaIssueStyles.disclosurePresetLink)}
    >
      <AreaIcon area="presets" className="h-3.5 w-3.5" />
      {children}
    </Link>
  )
}

function PairRow({ pair, currentPresetId }: { pair: LabelMismatchPair; currentPresetId?: string }) {
  const { fieldTranslations } = useSchema()
  const diff = diffLabelWords(pair.optionLabel, pair.childPresetName)
  const parent = pair.parentPresets[0]!

  return (
    <li className="grid gap-x-4 gap-y-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-slate-50">
          <span>
            <span className="text-xs text-slate-400">
              Option of “{fieldTranslations[pair.fieldId]?.label ?? pair.fieldId}”{' '}
            </span>
            <LabelDiff parts={diff.left} tone="dark" />
          </span>
          <span className="text-amber-300" aria-label="differs from">
            ≠
          </span>
          <span>
            <span className="text-xs text-slate-400">Preset </span>
            <LabelDiff parts={diff.right} tone="dark" />
          </span>
          <LabelMismatchKindPill kind={pair.kind} tone="dark" />
        </p>
        <p className="font-mono text-xs break-all text-slate-400">
          {pair.fieldId} · {pair.optionValue} → {pair.childPresetId}
        </p>
        {pair.previous ? (
          <p className="text-xs text-amber-300">
            Renamed since the last review (“{pair.previous.optionLabel}” ≠ “
            {pair.previous.presetName}”).
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <AreaLink
          area="fields"
          to="/field/$"
          params={{ _splat: pair.fieldId }}
          search={keepDataSource}
          title={`Open field “${pair.fieldId}”`}
          className="text-emerald-300 hover:text-emerald-200"
        >
          Field
        </AreaLink>
        {pair.childPresetId !== currentPresetId ? (
          <PresetLink presetId={pair.childPresetId}>Preset</PresetLink>
        ) : null}
        {parent.id !== currentPresetId ? (
          <PresetLink presetId={parent.id}>Parent preset</PresetLink>
        ) : null}
      </div>
    </li>
  )
}

/**
 * Field options whose label differs from the name of the preset they lead to. Pairs already
 * documented as intentional are left out; nothing renders when no pair is left.
 */
export function LabelMismatchDisclosure({
  disclosureId,
  pairs,
  currentPresetId,
}: {
  disclosureId: string
  pairs: LabelMismatchPair[]
  /** On a preset page: hides the link to the page itself. */
  currentPresetId?: string
}) {
  const { customDataUrl, reference } = useSchema()
  const open = pairs.filter((pair) => !pair.reviewed)
  if (open.length === 0) return null

  const first = open[0]!
  const auditHref = auditPageHref({
    slug: 'label-mismatch',
    dataUrl: customDataUrl ?? '',
    reference: customDataUrl ? undefined : reference,
    selected: `${first.parentPresets[0]!.id}:${first.fieldId}`,
  })
  const reviewedCount = pairs.length - open.length

  return (
    <SchemaIssueDisclosure
      disclosureId={disclosureId}
      variant="warning"
      title="Option ≠ preset name"
      summary={`${open.length} field option${open.length === 1 ? ' is' : 's are'} labelled differently than the preset ${open.length === 1 ? 'it leads' : 'they lead'} to`}
      bodyClassName="not-prose space-y-4"
    >
      <div data-testid="label-mismatch-panel" className="space-y-4">
        <p className="text-sm text-slate-300">
          Some options of a field have a preset of their own that iD switches to. Each line shows
          the English option label and the English name of that preset.
        </p>
        <ul className={cn('divide-y divide-slate-700', schemaIssueStyles.disclosureBodyInset)}>
          {open.map((pair) => (
            <PairRow
              key={`${pair.fieldId}|${pair.optionValue}|${pair.childPresetId}`}
              pair={pair}
              currentPresetId={currentPresetId}
            />
          ))}
        </ul>
        <p className="text-sm text-slate-300">
          {reviewedCount > 0
            ? `${reviewedCount} more ${reviewedCount === 1 ? 'pair is' : 'pairs are'} documented as intentional. `
            : null}
          <a href={auditHref} className={schemaIssueStyles.alertLink}>
            Review on the audit page →
          </a>
        </p>
      </div>
    </SchemaIssueDisclosure>
  )
}
