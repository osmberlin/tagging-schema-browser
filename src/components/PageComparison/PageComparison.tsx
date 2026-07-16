import { Link } from '@tanstack/react-router'
import { Fragment, useMemo, useState } from 'react'
import { ComparisonStaleBranchNotice } from '@/components/PageComparison/ComparisonStaleBranchNotice'
import { FieldDiffValue } from '@/components/PageComparison/FieldDiffValue'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { CountPill } from '@/components/ui/CountPill'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { UnsupportedSchemaNotice } from '@/components/ui/UnsupportedSchemaNotice'
import { useComparison } from '@/hooks/useComparison'
import { useSchema } from '@/hooks/useSchema'
import { comparisonAccent } from '@/theme/comparisonAccent'
import type { DiffEntry } from '@/utils/jsonDiff'
import { exportSchemaComparison } from '@/utils/pageExports'
import { isLikelyStaleBranchComparison } from '@/utils/presetDiff'
import type { ModifiedEntity } from '@/utils/schemaDiff'
import { entityChangeCount } from '@/utils/schemaDiff'
import { formatUnreleasedUpdatedAt } from '@/utils/schemaVersion'
import type { DenormalizedPreset } from '@/utils/types'

type CompareTab = 'presets' | 'fields' | 'categories'

function DiffGrid({ diffs }: { diffs: DiffEntry[] }) {
  if (diffs.length === 0) return null
  return (
    <dl className="border-t border-slate-100 px-3 py-2 text-xs">
      {diffs.map((d) => (
        <div key={d.label} className="grid grid-cols-[5.5rem_1fr] gap-x-3 py-0.5">
          <dt className="font-semibold tracking-wide text-slate-500 uppercase">{d.label}</dt>
          <dd className="min-w-0">
            <FieldDiffValue diff={d} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function PresetRow({
  preset,
  diffs,
  linkable = true,
}: {
  preset: DenormalizedPreset
  diffs?: DiffEntry[]
  linkable?: boolean
}) {
  const head = (
    <>
      <PresetIconBox preset={preset} size="sm" />
      <div className="min-w-0">
        <div className="font-medium text-slate-900">{preset.name}</div>
        <div className="font-mono text-[11px] text-slate-400">{preset.id}</div>
      </div>
    </>
  )
  return (
    <li className="rounded-xl border border-slate-200 bg-white">
      {linkable ? (
        <Link
          to="/preset/$"
          params={{ _splat: preset.id }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          className={`flex w-full items-start gap-2 px-3 py-2 text-left transition ${comparisonAccent.rowHover}`}
          title="Show details of preset"
        >
          {head}
        </Link>
      ) : (
        <div className="flex items-start gap-2 px-3 py-2" title="Only in baseline">
          {head}
        </div>
      )}
      {diffs ? <DiffGrid diffs={diffs} /> : null}
    </li>
  )
}

function EntityRow<T extends { id: string }>({
  entity,
  title,
  subtitle,
  diffs,
  linkTo,
  linkable = true,
}: {
  entity: T
  title: string
  subtitle: string
  diffs?: DiffEntry[]
  linkTo: '/field/$' | '/presets'
  linkable?: boolean
}) {
  const head = (
    <div className="min-w-0">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="font-mono text-[11px] text-slate-400">{subtitle}</div>
    </div>
  )

  return (
    <li className="rounded-xl border border-slate-200 bg-white">
      {linkable && linkTo === '/field/$' ? (
        <Link
          to="/field/$"
          params={{ _splat: entity.id }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          className={`block px-3 py-2 transition ${comparisonAccent.rowHover}`}
        >
          {head}
        </Link>
      ) : (
        <div className="px-3 py-2">{head}</div>
      )}
      {diffs ? <DiffGrid diffs={diffs} /> : null}
    </li>
  )
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string
  count: number
  accent: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${accent}`} aria-hidden />
        {title} <CountPill className="text-sm">{count}</CountPill>
      </h2>
      {count === 0 ? (
        <p className="text-sm text-slate-400">None.</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  )
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? `${comparisonAccent.text} bg-violet-100`
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {label}
      <CountPill className={active ? '' : 'bg-slate-200 text-slate-600'}>{count}</CountPill>
    </button>
  )
}

function EntitySections<T extends { id: string }>({
  added,
  removed,
  modified,
  renderAdded,
  renderRemoved,
  renderModified,
}: {
  added: T[]
  removed: T[]
  modified: ModifiedEntity<T>[]
  renderAdded: (entity: T) => React.ReactNode
  renderRemoved: (entity: T) => React.ReactNode
  renderModified: (entry: ModifiedEntity<T>) => React.ReactNode
}) {
  return (
    <div className="space-y-8">
      <Section title="Added" count={added.length} accent="bg-emerald-500">
        {added.map((entity) => (
          <Fragment key={entity.id}>{renderAdded(entity)}</Fragment>
        ))}
      </Section>
      <Section title="Modified" count={modified.length} accent="bg-violet-500">
        {modified.map((entry) => (
          <Fragment key={entry.current.id}>{renderModified(entry)}</Fragment>
        ))}
      </Section>
      <Section title="Removed" count={removed.length} accent="bg-rose-500">
        {removed.map((entity) => (
          <Fragment key={entity.id}>{renderRemoved(entity)}</Fragment>
        ))}
      </Section>
    </div>
  )
}

export function PageComparison() {
  const {
    isComparing,
    compareMode,
    compareLabel,
    domain,
    releaseVersion,
    result,
    loading,
    error,
    unreleasedUpdatedAt,
    baselineUnsupported,
    schemaUnsupported,
    baselineUrl,
    customPreviewUrl,
    unsupportedNoticeMessage,
  } = useComparison()
  const unreleasedAge = formatUnreleasedUpdatedAt(unreleasedUpdatedAt)
  const { dataUrl, data, unsupportedBuild } = useSchema()
  const [tab, setTab] = useState<CompareTab>('presets')
  const exportData = useMemo(() => (result ? exportSchemaComparison(result) : null), [result])
  const staleBranchHint =
    compareMode === 'preview' && result ? isLikelyStaleBranchComparison(result.presets) : false
  const unsupportedNoticeUrl =
    (baselineUnsupported ? baselineUrl : null) ??
    (schemaUnsupported ? customPreviewUrl : null) ??
    dataUrl

  if (!dataUrl && !data) {
    return <p className="text-sm text-slate-500">Load schema data from the Presets page first.</p>
  }

  if (!isComparing) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Comparison</h1>
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          You're viewing a release or unreleased build, so there's nothing to compare. Load a custom
          build (a PR preview <code className="font-mono">dataUrl</code>) to see what changed
          against unreleased or release.
        </p>
      </div>
    )
  }

  const activeLabel =
    compareMode === 'release' ? `Release${releaseVersion ? ` ${releaseVersion}` : ''}` : domain
  const baselineLabel =
    compareMode === 'release'
      ? `${compareLabel}${compareLabel === 'unreleased' && unreleasedAge ? ` · ${unreleasedAge}` : ''}`
      : `unreleased${unreleasedAge ? ` · ${unreleasedAge}` : ''}`
  const loadingLabel =
    compareMode === 'release' && compareLabel !== 'unreleased'
      ? 'Loading PR preview to compare…'
      : 'Loading unreleased to compare…'
  const errorLabel =
    compareMode === 'release' && compareLabel !== 'unreleased'
      ? 'Could not load PR preview for comparison'
      : 'Could not load unreleased for comparison'

  const presetCount = result
    ? result.presets.added.length + result.presets.removed.length + result.presets.modified.length
    : 0
  const fieldCount = result ? entityChangeCount(result.fields) : 0
  const categoryCount = result ? entityChangeCount(result.categories) : 0

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Comparison</h1>
          {exportData ? <DownloadButton filename="comparison.json" data={exportData} /> : null}
        </div>
        <p className="text-sm text-slate-500">
          <span className={`font-mono ${comparisonAccent.text}`}>{activeLabel}</span> vs{' '}
          {baselineLabel}. Semantic diff of presets, fields, and categories — property order
          ignored, list order respected where it matters.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{loadingLabel}</p>
      ) : baselineUnsupported || schemaUnsupported || unsupportedBuild ? (
        <UnsupportedSchemaNotice
          build={unsupportedBuild ?? undefined}
          message={unsupportedNoticeMessage ?? undefined}
          dataUrl={unsupportedNoticeUrl}
          comparisonBaseline={baselineUnsupported}
        />
      ) : error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {errorLabel}: {error}
        </p>
      ) : result ? (
        <>
          {staleBranchHint ? <ComparisonStaleBranchNotice /> : null}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Comparison scope">
            <TabButton
              active={tab === 'presets'}
              label="Presets"
              count={presetCount}
              onClick={() => setTab('presets')}
            />
            <TabButton
              active={tab === 'fields'}
              label="Fields"
              count={fieldCount}
              onClick={() => setTab('fields')}
            />
            <TabButton
              active={tab === 'categories'}
              label="Categories"
              count={categoryCount}
              onClick={() => setTab('categories')}
            />
          </div>

          {tab === 'presets' ? (
            <EntitySections
              added={result.presets.added}
              removed={result.presets.removed}
              modified={result.presets.modified.map((m) => ({
                current: m.current,
                baseline: m.release,
                diffs: m.diffs,
              }))}
              renderAdded={(preset) => <PresetRow preset={preset} />}
              renderRemoved={(preset) => <PresetRow preset={preset} linkable={false} />}
              renderModified={(entry) => <PresetRow preset={entry.current} diffs={entry.diffs} />}
            />
          ) : null}

          {tab === 'fields' ? (
            <EntitySections
              added={result.fields.added}
              removed={result.fields.removed}
              modified={result.fields.modified}
              renderAdded={(field) => (
                <EntityRow
                  entity={field}
                  title={field.label}
                  subtitle={`${field.id} · ${field.type}`}
                  linkTo="/field/$"
                />
              )}
              renderRemoved={(field) => (
                <EntityRow
                  entity={field}
                  title={field.label}
                  subtitle={`${field.id} · ${field.type}`}
                  linkTo="/field/$"
                  linkable={false}
                />
              )}
              renderModified={(entry) => (
                <EntityRow
                  entity={entry.current}
                  title={entry.current.label}
                  subtitle={`${entry.current.id} · ${entry.current.type}`}
                  diffs={entry.diffs}
                  linkTo="/field/$"
                />
              )}
            />
          ) : null}

          {tab === 'categories' ? (
            <EntitySections
              added={result.categories.added}
              removed={result.categories.removed}
              modified={result.categories.modified}
              renderAdded={(category) => (
                <EntityRow
                  entity={category}
                  title={category.name}
                  subtitle={category.id}
                  linkTo="/presets"
                />
              )}
              renderRemoved={(category) => (
                <EntityRow
                  entity={category}
                  title={category.name}
                  subtitle={category.id}
                  linkTo="/presets"
                  linkable={false}
                />
              )}
              renderModified={(entry) => (
                <EntityRow
                  entity={entry.current}
                  title={entry.current.name}
                  subtitle={entry.current.id}
                  diffs={entry.diffs}
                  linkTo="/presets"
                />
              )}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
