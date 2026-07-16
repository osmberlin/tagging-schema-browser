import { Link, useParams } from '@tanstack/react-router'
import { FieldDiffValue } from '@/components/PageComparison/FieldDiffValue'
import { GeometryIcons } from '@/components/PagePresets/geometryIcons'
import { LazyPresetSourceTree } from '@/components/PagePresets/LazyPresetSourceTree'
import { MissingInheritancePanel } from '@/components/PagePresets/MissingInheritancePanel'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { PresetIconMismatchPanel } from '@/components/PagePresets/PresetIconMismatchPanel'
import { PresetTranslationTable } from '@/components/PagePresets/PresetTranslationTable'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { presetSwitchSearchDefaults } from '@/components/PagePresetSwitch/presetSwitchSearch'
import { AreaIcon } from '@/components/ui/areaIcons'
import { AreaLink } from '@/components/ui/AreaLink'
import { DetailDisclosure } from '@/components/ui/DetailDisclosure'
import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { useComparison } from '@/hooks/useComparison'
import { useLocale } from '@/hooks/useLocale'
import { useSchema } from '@/hooks/useSchema'
import { areaInlineCodeClass, areaNavButtonClass } from '@/theme/areaAccent'
import { externalLinkClass, externalActionPillClass } from '@/theme/externalAccent'
import { githubFileUrl, schemaRepoPath } from '@/utils/githubFileUrl'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset, SchemaIndices } from '@/utils/types'

export function PresetDetailPage() {
  const { _splat: presetId } = useParams({ strict: false })
  const { presetsById, presets, rawPresets, dataUrl, data, loading, error } = useSchema()
  const preset = presetId ? presetsById.get(presetId) : undefined
  const raw = presetId ? rawPresets[presetId] : undefined

  if (!presetId) {
    return <p className="text-sm text-slate-600">No preset id in URL.</p>
  }

  if (loading && !data) {
    return <SchemaLoadingPanel label="Loading schema…" />
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Schema failed to load</h1>
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    )
  }

  if (!preset || !raw || !data) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Preset not found</h1>
        <p className="text-sm text-slate-600">
          No preset matches <code className="font-mono text-xs">{presetId}</code> for the loaded
          schema.
        </p>
      </div>
    )
  }

  return (
    <PresetDetailContent
      key={preset.id}
      preset={preset}
      raw={raw as Record<string, unknown>}
      presets={presets}
      indices={data.indices}
      dataUrl={dataUrl ?? ''}
    />
  )
}

function PresetDetailContent({
  preset,
  raw,
  presets,
  indices,
  dataUrl,
}: {
  preset: DenormalizedPreset
  raw: Record<string, unknown>
  presets: DenormalizedPreset[]
  indices: SchemaIndices
  dataUrl: string
}) {
  const { locale, localeMap, loading: localeLoading, error: localeError } = useLocale()
  const loc = locale ? localeMap?.get(preset.id) : undefined

  const { result: comparison } = useComparison()
  const changeStatus = comparison?.statusById.get(preset.id)
  const modified = comparison?.modified.find((m) => m.current.id === preset.id)

  const filePath = schemaRepoPath('preset', preset.id, { searchable: preset.searchable })
  const githubUrl = githubFileUrl(dataUrl, filePath)
  const iconId = preset.icon

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          <PresetIconBox preset={preset} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-slate-950">
                  {preset.name}
                </h1>
                <p className="mt-1 font-mono text-sm text-slate-500">{preset.id}</p>
              </div>
              <Link
                to="/preset-switch"
                search={(prev) => ({
                  ...presetSwitchSearchDefaults,
                  dataUrl: prev.dataUrl ?? '',
                  locale: prev.locale ?? '',
                  preset1: preset.id,
                })}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5',
                  areaNavButtonClass('presetSwitch'),
                )}
              >
                <AreaIcon area="presetSwitch" className="h-3.5 w-3.5" />
                Compare preset switch
              </Link>
            </div>
            <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex shrink-0 items-center gap-2 text-slate-600">
                <span className="font-medium text-slate-500">Geometry</span>
                <GeometryIcons geometry={preset.geometry} />
              </span>
              {preset.categoryNames.length > 0 || iconId ? (
                <span className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1">
                  {preset.categoryNames.map((categoryName) => (
                    <AreaLink
                      key={categoryName}
                      area="presets"
                      to="/"
                      search={(prev) => ({
                        ...presetSearchDefaults,
                        dataUrl: prev.dataUrl ?? '',
                        locale: prev.locale ?? '',
                        categoryNames: [categoryName],
                        page: 1,
                      })}
                      title={`Show presets in category "${categoryName}"`}
                      className="max-w-full gap-1"
                      iconClassName="shrink-0"
                    >
                      Presets for Category &ldquo;{categoryName}&rdquo;
                    </AreaLink>
                  ))}
                  {iconId ? (
                    <AreaLink
                      area="presets"
                      iconArea="icons"
                      to="/"
                      search={(prev) => ({
                        ...presetSearchDefaults,
                        dataUrl: prev.dataUrl ?? '',
                        locale: prev.locale ?? '',
                        iconName: [iconId],
                        page: 1,
                      })}
                      title={`Show presets using icon "${iconId}"`}
                      className="max-w-full gap-1"
                      iconClassName="shrink-0"
                    >
                      Presets for icon{' '}
                      <code className={areaInlineCodeClass('presets')}>{iconId}</code>
                    </AreaLink>
                  ) : null}
                </span>
              ) : null}
            </div>
            {preset.imageURL ? (
              <p className="mt-2 text-sm">
                <span className="text-slate-500">imageURL: </span>
                <a
                  href={preset.imageURL}
                  className={`break-all underline ${externalLinkClass('break-all')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {preset.imageURL}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <PresetIconMismatchPanel
        preset={preset}
        parentRows={indices.parentIconMismatchRowsByPresetId.get(preset.id) ?? []}
        childRefs={indices.childIconMismatchRefsByPresetId.get(preset.id) ?? []}
      />

      <MissingInheritancePanel preset={preset} />

      <DetailDisclosure
        title="Translation"
        area="translations"
        subtitle={
          locale ? (
            <>
              EN ↔ <span className="font-mono">{locale}</span>
            </>
          ) : (
            'English'
          )
        }
        defaultOpen
      >
        {locale && localeLoading ? (
          <p className="px-4 py-3 text-sm text-slate-500">Loading {locale}…</p>
        ) : locale && localeError ? (
          <p className="mx-4 my-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {localeError}
          </p>
        ) : (
          <PresetTranslationTable
            preset={preset}
            locale={locale}
            localized={loc ? { name: loc.name, terms: loc.terms, aliases: loc.aliases } : undefined}
          />
        )}
      </DetailDisclosure>

      <DetailDisclosure
        title="Source preset"
        actions={
          <>
            <code className="font-mono text-xs text-slate-500">{filePath}</code>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={externalActionPillClass()}
            >
              GitHub ↗
            </a>
          </>
        }
        defaultOpen
      >
        <LazyPresetSourceTree presetId={preset.id} raw={raw} preset={preset} presets={presets} />
      </DetailDisclosure>

      {changeStatus === 'added' || changeStatus === 'modified' ? (
        <DetailDisclosure
          title={changeStatus === 'added' ? 'Added vs unreleased' : 'Changes vs unreleased'}
          defaultOpen
          className="border-violet-200 bg-violet-50/40"
        >
          <div className="px-4 py-3">
            {changeStatus === 'added' ? (
              <p className="text-sm text-violet-700">This preset does not exist in the release.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {modified?.diffs.map((d) => (
                  <li key={d.label} className="grid grid-cols-[5rem_1fr] gap-x-3">
                    <span className="font-semibold tracking-wide text-violet-500 uppercase">
                      {d.label}
                    </span>
                    <span className="min-w-0">
                      <FieldDiffValue diff={d} arrowClass="text-slate-400" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DetailDisclosure>
      ) : null}
    </div>
  )
}
