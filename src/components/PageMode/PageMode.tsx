import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { GEOMETRY_OPTIONS } from '@/components/PageMode/modeSearch'
import { useModeSearch } from '@/components/PageMode/useModeSearch'
import { GeometryIcons } from '@/components/PagePresets/geometryIcons'
import { AreaIcon } from '@/components/ui/areaIcons'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { externalLinkClass } from '@/theme/externalAccent'
import { parseOsmTags } from '@/utils/parseOsmTags'
import { matchPresetMode } from '@/utils/presetModeMatch'
import { cn } from '@/utils/tw'

function PresetLink({ presetId }: { presetId: string }) {
  if (presetId.startsWith('fallback/')) {
    return <span className="font-mono text-xs text-slate-600">{presetId}</span>
  }
  return (
    <Link
      to="/preset/$"
      params={{ _splat: presetId }}
      search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
      className="font-mono text-xs text-indigo-700 hover:underline"
    >
      {presetId}
    </Link>
  )
}

function MatchCard({
  candidate,
  rank,
  isWinner,
  addTagsGaps,
  hiddenFields,
}: {
  candidate: ReturnType<typeof matchPresetMode>['matches'][number]
  rank: number
  isWinner: boolean
  addTagsGaps?: ReturnType<typeof matchPresetMode>['addTagsGaps']
  hiddenFields?: ReturnType<typeof matchPresetMode>['fieldVisibility']
}) {
  return (
    <article
      className={cn(
        'rounded-xl border p-4',
        isWinner ? 'border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200' : 'border-slate-200',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {isWinner ? 'Would win in iD' : `Match #${rank}`}
          </p>
          <PresetLink presetId={candidate.presetId} />
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>
            score <span className="font-mono text-slate-800">{candidate.score.toFixed(2)}</span>
          </p>
          <p>{candidate.tagCount} tag(s)</p>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Region:</span> {candidate.locationSummary}
      </p>

      {candidate.locationSet ? (
        <details className="mt-2 text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700">locationSet</summary>
          <pre className="mt-1 overflow-x-auto rounded bg-white/80 p-2 font-mono text-[11px]">
            {JSON.stringify(candidate.locationSet, null, 2)}
          </pre>
        </details>
      ) : null}

      {isWinner && addTagsGaps && addTagsGaps.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          <p className="font-medium">addTags gaps</p>
          <p className="mt-1 text-xs text-amber-800">
            iD would apply these when selecting the preset; your tags are missing or differ:
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {addTagsGaps.map((gap) => (
              <li key={gap.key}>
                missing{' '}
                <code>
                  {gap.key}={gap.expected}
                </code>
                {gap.actual !== undefined ? (
                  <span className="text-amber-700"> (have {gap.actual})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isWinner && hiddenFields && hiddenFields.some((f) => !f.visible) ? (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/80 p-3 text-sm text-sky-950">
          <p className="font-medium">Conditional fields</p>
          <ul className="mt-2 space-y-1 text-xs">
            {hiddenFields
              .filter((f) => !f.visible)
              .map((f) => (
                <li key={f.fieldId}>
                  <Link
                    to="/field/$"
                    params={{ _splat: f.fieldId }}
                    search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                    className="font-mono text-sky-800 hover:underline"
                  >
                    {f.fieldId}
                  </Link>
                  {f.reason ? <span className="text-sky-700"> — {f.reason}</span> : null}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}

export function PageMode() {
  const { presetsById, rawPresets, fields, discarded, loading, error } = useSchema()
  const [search, setSearch] = useModeSearch()

  const tags = useMemo(() => parseOsmTags(search.tags), [search.tags])
  const result = useMemo(
    () =>
      matchPresetMode({
        tags,
        geometry: search.geometry,
        region: search.region.trim() || undefined,
        rawPresets,
        fields,
        discarded,
      }),
    [tags, search.geometry, search.region, rawPresets, fields, discarded],
  )

  const winnerId = result.winner?.presetId
  const otherMatches = result.matches.filter((m) => m.presetId !== winnerId)

  if (loading) {
    return <p className="text-sm text-slate-600">Loading schema…</p>
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Schema failed to load</h1>
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2">
          <span className={`rounded-lg p-2 ${areaAccent.mode.iconBg}`}>
            <AreaIcon area="mode" className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-slate-950">Mode</h1>
        </div>
        <p className="max-w-3xl text-sm text-slate-600">
          Experiment with OSM tags and see which preset iD would pick, including regional{' '}
          <code className="font-mono text-xs">locationSet</code> rules,{' '}
          <code className="font-mono text-xs">addTags</code> gaps, field{' '}
          <code className="font-mono text-xs">prerequisiteTag</code> visibility, and{' '}
          <code className="font-mono text-xs">discarded.json</code> warnings. Uses the schema from
          the URL <code className="font-mono text-xs">dataUrl</code> / reference toggle.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-800">Tags</span>
            <textarea
              value={search.tags}
              onChange={(e) => setSearch({ tags: e.target.value })}
              rows={12}
              spellCheck={false}
              placeholder={'amenity=cafe\nname=Example'}
              className={cn(
                'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm',
                areaAccent.mode.focus,
              )}
            />
            <span className="text-xs text-slate-500">
              One tag per line: key=value. Lines starting with # are ignored.
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-800">Geometry</span>
              <select
                value={search.geometry}
                onChange={(e) =>
                  setSearch({ geometry: e.target.value as (typeof GEOMETRY_OPTIONS)[number] })
                }
                className={cn(
                  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
                  areaAccent.mode.focus,
                )}
              >
                {GEOMETRY_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-800">Region (optional)</span>
              <input
                type="text"
                value={search.region}
                onChange={(e) => setSearch({ region: e.target.value })}
                placeholder="gb, us, de…"
                className={cn(
                  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm',
                  areaAccent.mode.focus,
                )}
              />
              <span className="text-xs text-slate-500">
                Simulates map location for locationSet filtering.
              </span>
            </label>
          </div>

          {result.discardedTagKeys.length > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-950">
              <p className="font-medium">Discarded tags on feature</p>
              <p className="mt-1 text-xs text-rose-800">
                These keys appear in{' '}
                <a
                  href="https://github.com/openstreetmap/id-tagging-schema/blob/main/data/discarded.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass()}
                >
                  discarded.json
                </a>
                :
              </p>
              <ul className="mt-2 font-mono text-xs">
                {result.discardedTagKeys.map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <GeometryIcons geometry={[search.geometry]} className="h-4 w-4" />
            <span>
              {Object.keys(tags).length} tag(s) parsed
              {search.region ? (
                <>
                  <span className="mx-2 text-slate-300">·</span>
                  simulating{' '}
                  <code className="font-mono text-xs">{search.region.toUpperCase()}</code>
                </>
              ) : null}
              {result.fallbackUsed ? (
                <>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-amber-700">geometry fallback</span>
                </>
              ) : null}
            </span>
          </div>

          {result.winner ? (
            <MatchCard
              candidate={result.winner}
              rank={1}
              isWinner
              addTagsGaps={result.addTagsGaps}
              hiddenFields={result.fieldVisibility}
            />
          ) : (
            <p className="text-sm text-slate-500">
              No preset matches these tags for this geometry.
            </p>
          )}

          {result.regionWinners.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <h2 className="text-sm font-semibold text-slate-800">Regional winners</h2>
              <p className="mt-1 text-xs text-slate-500">
                Among matching presets, who would win when the map is in each region:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {result.regionWinners.map((rw) => {
                  const name = presetsById.get(rw.presetId)?.name
                  return (
                    <li key={rw.region} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {rw.region}
                      </span>
                      <span className="text-slate-400">→</span>
                      <PresetLink presetId={rw.presetId} />
                      {name ? <span className="text-slate-500">({name})</span> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {otherMatches.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Other matches ({otherMatches.length})
              </h2>
              {otherMatches.map((candidate, index) => (
                <MatchCard
                  key={candidate.presetId}
                  candidate={candidate}
                  rank={index + 2}
                  isWinner={false}
                />
              ))}
            </div>
          ) : null}

          {Object.keys(tags).length === 0 ? (
            <p className="text-sm text-slate-500">
              Enter tags on the left to see matching presets.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
