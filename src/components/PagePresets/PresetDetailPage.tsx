import { Link, useParams } from '@tanstack/react-router'
import { FieldDiffValue } from '@/components/PageComparison/FieldDiffValue'
import { GeometryIcons } from '@/components/PagePresets/geometryIcons'
import { MissingInheritancePanel } from '@/components/PagePresets/MissingInheritancePanel'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { PresetIconMismatchPanel } from '@/components/PagePresets/PresetIconMismatchPanel'
import { PresetSourceTree } from '@/components/PagePresets/PresetSourceTree'
import { PresetTranslationTable } from '@/components/PagePresets/PresetTranslationTable'
import { presetSwitchSearchDefaults } from '@/components/PagePresetSwitch/presetSwitchSearch'
import { AreaIcon } from '@/components/ui/areaIcons'
import { DetailDisclosure } from '@/components/ui/DetailDisclosure'
import { RelatedBlock } from '@/components/ui/RelatedBlock'
import { useComparison } from '@/hooks/useComparison'
import { useLocale } from '@/hooks/useLocale'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { externalAccent, externalLinkClass, externalPillClass } from '@/theme/externalAccent'
import { githubFileUrl, schemaRepoPath } from '@/utils/githubFileUrl'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset } from '@/utils/types'

type RelatedItem = { id: string; name: string }

export function PresetDetailPage() {
  const { _splat: presetId } = useParams({ strict: false })
  const { presetsById, presets, rawPresets, dataUrl, loading, error } = useSchema()
  const preset = presetId ? presetsById.get(presetId) : undefined
  const raw = presetId ? rawPresets[presetId] : undefined

  if (!presetId) {
    return <p className="text-sm text-slate-600">No preset id in URL.</p>
  }

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

  if (!preset || !raw) {
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
      preset={preset}
      raw={raw as Record<string, unknown>}
      presets={presets}
      dataUrl={dataUrl ?? ''}
    />
  )
}

function PresetDetailContent({
  preset,
  raw,
  presets,
  dataUrl,
}: {
  preset: DenormalizedPreset
  raw: Record<string, unknown>
  presets: DenormalizedPreset[]
  dataUrl: string
}) {
  const { locale, localeMap, loading: localeLoading, error: localeError } = useLocale()
  const { fields, fieldTranslations } = useSchema()
  const loc = locale ? localeMap?.get(preset.id) : undefined

  const { result: comparison } = useComparison()
  const changeStatus = comparison?.statusById.get(preset.id)
  const modified = comparison?.modified.find((m) => m.current.id === preset.id)

  const filePath = schemaRepoPath('preset', preset.id, { searchable: preset.searchable })
  const githubUrl = githubFileUrl(dataUrl, filePath)

  const toItem = (c: DenormalizedPreset): RelatedItem => ({ id: c.id, name: c.name })

  const categorySections = preset.categoryNames.map((categoryName, index) => {
    const categoryId = preset.categoryIds[index]
    const related = presets
      .filter((c) => c.id !== preset.id && c.categoryIds.includes(categoryId))
      .map(toItem)
    return {
      title: `Presets of this category "${categoryName}"`,
      titleFilter: { categoryNames: [categoryName] },
      related,
    }
  })

  const uncategorizedRelated =
    preset.categoryNames.length === 0
      ? presets.filter((c) => c.id !== preset.id && c.categoryNames.length === 0).map(toItem)
      : []

  const iconId = preset.icon
  const iconRelated = iconId
    ? presets.filter((c) => c.id !== preset.id && c.icon === iconId).map(toItem)
    : []

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
          <PresetIconBox preset={preset} size="md" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-slate-950">{preset.name}</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">{preset.id}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Geometry</span>
              <GeometryIcons geometry={preset.geometry} />
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
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            to="/preset-switch"
            search={(prev) => ({
              ...presetSwitchSearchDefaults,
              dataUrl: prev.dataUrl ?? '',
              locale: prev.locale ?? '',
              preset1: preset.id,
            })}
            className={cn('inline-flex items-center gap-1.5', areaAccent.presetSwitch.navActive)}
          >
            <AreaIcon area="presetSwitch" className="h-3.5 w-3.5" />
            Compare preset switch
          </Link>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={externalAccent.button}
          >
            View source ↗
          </a>
        </div>
      </header>

      <PresetIconMismatchPanel
        preset={preset}
        presets={presets}
        fields={fields}
        fieldTranslations={fieldTranslations}
      />

      <MissingInheritancePanel preset={preset} dataUrl={dataUrl} />

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
              className={externalPillClass()}
            >
              GitHub ↗
            </a>
          </>
        }
        defaultOpen
      >
        <PresetSourceTree
          key={preset.id}
          presetId={preset.id}
          raw={raw}
          preset={preset}
          presets={presets}
        />
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

      <DetailDisclosure title="Related presets" area="presets">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {categorySections.map((section) => (
            <RelatedBlock
              key={section.title}
              title={section.title}
              count={section.related.length}
              titleFilter={section.titleFilter}
              presets={section.related}
            />
          ))}
          {preset.categoryNames.length === 0 && (
            <RelatedBlock
              title="Presets with no category"
              count={uncategorizedRelated.length}
              titleFilter={{ categoryNames: ['No Category'] }}
              presets={uncategorizedRelated}
            />
          )}
          {iconId ? (
            <RelatedBlock
              title={`Presets with this icon \`${iconId}\``}
              count={iconRelated.length}
              titleFilter={{ iconName: [iconId] }}
              presets={iconRelated}
              area="icons"
            />
          ) : null}
        </div>
      </DetailDisclosure>
    </div>
  )
}
