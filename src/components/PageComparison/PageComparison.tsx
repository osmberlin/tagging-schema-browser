import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ComparisonStaleBranchNotice } from '@/components/PageComparison/ComparisonStaleBranchNotice'
import { FieldDiffValue } from '@/components/PageComparison/FieldDiffValue'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { CountPill } from '@/components/ui/CountPill'
import { DownloadButton } from '@/components/ui/DownloadButton'
import { UnsupportedSchemaNotice } from '@/components/ui/UnsupportedSchemaNotice'
import { useComparison } from '@/hooks/useComparison'
import { useSchema } from '@/hooks/useSchema'
import { comparisonAccent } from '@/theme/comparisonAccent'
import { exportComparison } from '@/utils/pageExports'
import { isLikelyStaleBranchComparison, type FieldDiff } from '@/utils/presetDiff'
import { formatUnreleasedUpdatedAt } from '@/utils/schemaVersion'
import type { DenormalizedPreset } from '@/utils/types'

function PresetRow({
  preset,
  diffs,
  linkable = true,
}: {
  preset: DenormalizedPreset
  diffs?: FieldDiff[]
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
        <div className="flex items-start gap-2 px-3 py-2" title="Only in unreleased">
          {head}
        </div>
      )}
      {diffs && diffs.length > 0 ? (
        <dl className="border-t border-slate-100 px-3 py-2 text-xs">
          {diffs.map((d) => (
            <div key={d.label} className="grid grid-cols-[5rem_1fr] gap-x-3 py-0.5">
              <dt className="font-semibold tracking-wide text-slate-500 uppercase">{d.label}</dt>
              <dd className="min-w-0">
                <FieldDiffValue diff={d} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
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
  const exportData = useMemo(() => (result ? exportComparison(result) : null), [result])
  const staleBranchHint =
    compareMode === 'preview' && result ? isLikelyStaleBranchComparison(result) : false
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Comparison</h1>
          {exportData ? <DownloadButton filename="comparison.json" data={exportData} /> : null}
        </div>
        <p className="text-sm text-slate-500">
          <span className={`font-mono ${comparisonAccent.text}`}>{activeLabel}</span> vs{' '}
          {baselineLabel}.
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
        <div className="space-y-8">
          {staleBranchHint ? <ComparisonStaleBranchNotice /> : null}
          <Section title="Added" count={result.added.length} accent="bg-emerald-500">
            {result.added.map((p) => (
              <PresetRow key={p.id} preset={p} />
            ))}
          </Section>
          <Section title="Modified" count={result.modified.length} accent="bg-violet-500">
            {result.modified.map((m) => (
              <PresetRow key={m.current.id} preset={m.current} diffs={m.diffs} />
            ))}
          </Section>
          <Section title="Removed" count={result.removed.length} accent="bg-rose-500">
            {result.removed.map((p) => (
              <PresetRow key={p.id} preset={p} linkable={false} />
            ))}
          </Section>
        </div>
      ) : null}
    </div>
  )
}
