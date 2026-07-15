import { useParams } from '@tanstack/react-router'
import { FieldOptionIconsTable } from '@/components/PageFields/FieldOptionIconsTable'
import { FieldTranslationTable } from '@/components/PageFields/FieldTranslationTable'
import { GeometryIcons } from '@/components/PagePresets/geometryIcons'
import { LazyPresetSourceTree } from '@/components/PagePresets/LazyPresetSourceTree'
import { useSetPreset, presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { AreaLink } from '@/components/ui/AreaLink'
import { CountPill } from '@/components/ui/CountPill'
import { DetailDisclosure } from '@/components/ui/DetailDisclosure'
import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { RelatedBlock } from '@/components/ui/RelatedBlock'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { useAutoOpenFocusedIssue } from '@/features/schema-issue/useAutoOpenFocusedIssue'
import { useLocale } from '@/hooks/useLocale'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent, areaInlineCodeClass } from '@/theme/areaAccent'
import { externalActionPillClass } from '@/theme/externalAccent'
import { fieldTypeHint } from '@/utils/fieldTypes'
import { githubFileUrl, schemaRepoPath } from '@/utils/githubFileUrl'
import { formatPrerequisiteTag, parsePrerequisiteTag } from '@/utils/prerequisiteTag'
import { cn } from '@/utils/tw'
import type { FieldOptionMismatchRow } from '@/utils/types'
import type { DenormalizedPreset, RawFieldTranslation } from '@/utils/types'

type RelatedItem = { id: string; name: string }

function toRelatedItem(p: DenormalizedPreset): RelatedItem {
  return { id: p.id, name: p.name }
}

export function FieldDetailPage() {
  const { _splat: fieldId } = useParams({ strict: false })
  const { fields, data, dataUrl, loading, error } = useSchema()
  const raw = fieldId ? fields[fieldId] : undefined

  if (!fieldId) {
    return <p className="text-sm text-slate-600">No field id in URL.</p>
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Schema failed to load</h1>
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    )
  }

  if (loading && !data) {
    return <SchemaLoadingPanel label="Loading schema…" />
  }

  if (!raw || !data) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Field not found</h1>
        <p className="text-sm text-slate-600">
          No field matches <code className="font-mono text-xs">{fieldId}</code> for the loaded
          schema.
        </p>
      </div>
    )
  }

  const english: RawFieldTranslation = data?.fieldTranslations[fieldId] ?? {
    label: typeof raw.label === 'string' ? raw.label : undefined,
    placeholder: typeof raw.placeholder === 'string' ? raw.placeholder : undefined,
  }

  const primaryPresets = data.indices.presetsByPrimaryField.get(fieldId) ?? []
  const morePresets = data.indices.presetsByMoreField.get(fieldId) ?? []

  return (
    <FieldDetailContent
      key={fieldId}
      fieldId={fieldId}
      raw={raw as Record<string, unknown>}
      english={english}
      primaryPresets={primaryPresets}
      morePresets={morePresets}
      dataUrl={dataUrl ?? ''}
      optionRows={data.indices.fieldOptionMismatchRows.get(fieldId) ?? []}
    />
  )
}

function FieldDetailContent({
  fieldId,
  raw,
  english,
  primaryPresets,
  morePresets,
  dataUrl,
  optionRows,
}: {
  fieldId: string
  raw: Record<string, unknown>
  english: RawFieldTranslation
  primaryPresets: DenormalizedPreset[]
  morePresets: DenormalizedPreset[]
  dataUrl: string
  optionRows: FieldOptionMismatchRow[]
}) {
  const setPreset = useSetPreset()
  const { loading: localeLoading, error: localeError, locale, fieldLocaleMap } = useLocale()
  const fieldLocale = locale ? fieldLocaleMap?.[fieldId] : undefined

  const filePath = schemaRepoPath('field', fieldId)
  const githubUrl = githubFileUrl(dataUrl, filePath)
  const label = english.label ?? fieldId
  const key = typeof raw.key === 'string' ? raw.key : fieldId
  const type = typeof raw.type === 'string' ? raw.type : 'unknown'
  const typeHint = fieldTypeHint(type)
  const prerequisiteTag = parsePrerequisiteTag(raw.prerequisiteTag)
  const geometry = Array.isArray(raw.geometry) ? (raw.geometry as string[]) : []

  const onFilterPrimaryPresets = { primaryFieldIds: [fieldId] }
  const onFilterMorePresets = { moreFieldIds: [fieldId] }

  const mismatchCount = optionRows.filter((row) => row.iconMismatch).length
  const mismatchDisclosureId = `field-icon-mismatch:${fieldId}`
  useAutoOpenFocusedIssue(mismatchDisclosureId, 'iconMismatch', mismatchCount > 0)
  const presetUsageCount = primaryPresets.length + morePresets.length

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex min-w-0 flex-wrap items-start gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ring-emerald-100 ring-inset ${areaAccent.fields.iconBg}`}
          >
            <AreaIcon area="fields" className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold text-slate-950">{label}</h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{fieldId}</p>
            <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-600">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs"
                  title={typeHint}
                >
                  {type}
                </span>
                {typeHint ? <span className="text-xs text-slate-500">{typeHint}</span> : null}
                <span>
                  key: <code className="font-mono text-xs">{key}</code>
                </span>
                {raw.universal ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
                    universal
                  </span>
                ) : null}
                {geometry.length > 0 ? (
                  <span className="inline-flex shrink-0 items-center gap-2">
                    <span className="font-medium text-slate-500">Geometry</span>
                    <GeometryIcons geometry={geometry} />
                  </span>
                ) : null}
              </div>
              {presetUsageCount > 0 ? (
                <AreaLink
                  area="presets"
                  showIcon={false}
                  to="/"
                  search={(prev) => ({
                    ...presetSearchDefaults,
                    dataUrl: prev.dataUrl ?? '',
                    locale: prev.locale ?? '',
                    fieldIds: [fieldId],
                    page: 1,
                  })}
                  title={`Show all ${presetUsageCount} presets using “${label}” in fields or moreFields`}
                  className="inline-flex shrink-0 flex-wrap items-center gap-1.5"
                >
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <CountPill className={cn(areaAccent.presets.pill, areaAccent.presets.pillText)}>
                      {presetUsageCount}
                    </CountPill>
                    <span>
                      Presets using {label} in{' '}
                      <code className={areaInlineCodeClass('presets')}>fields</code>
                      {' or '}
                      <code className={areaInlineCodeClass('presets')}>moreFields</code>
                    </span>
                  </span>
                </AreaLink>
              ) : null}
            </div>
            {prerequisiteTag ? (
              <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                <span className="font-medium">Visibility: </span>
                {formatPrerequisiteTag(prerequisiteTag)}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {mismatchCount > 0 ? (
        <SchemaIssueDisclosure
          disclosureId={mismatchDisclosureId}
          variant="warning"
          title="Icon mismatch"
          summary={`${mismatchCount} option${mismatchCount === 1 ? '' : 's'} use a different icon than the linked child preset${mismatchCount === 1 ? '' : 's'}`}
          bodyClassName="not-prose"
        >
          <FieldOptionIconsTable rows={optionRows} onOpenPreset={setPreset} variant="inset" />
        </SchemaIssueDisclosure>
      ) : (
        <DetailDisclosure
          title="Option icons"
          count={optionRows.length}
          area="icons"
          subtitle="Field option icons vs dedicated child preset icons"
        >
          <FieldOptionIconsTable rows={optionRows} onOpenPreset={setPreset} />
        </DetailDisclosure>
      )}

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
          <FieldTranslationTable
            fieldId={fieldId}
            english={english}
            localized={fieldLocale}
            locale={locale}
          />
        )}
      </DetailDisclosure>

      <DetailDisclosure
        title="Source field"
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
        <LazyPresetSourceTree presetId={fieldId} raw={raw} sourceKind="field" />
      </DetailDisclosure>

      <DetailDisclosure title="Related presets" area="presets" defaultOpen>
        <div className="grid gap-6 px-4 py-4 sm:grid-cols-2 sm:gap-8">
          <RelatedBlock
            title={
              <>
                Presets using {label} in{' '}
                <code className={areaInlineCodeClass('presets')}>fields</code>
              </>
            }
            count={primaryPresets.length}
            titleFilter={onFilterPrimaryPresets}
            presets={primaryPresets.map(toRelatedItem)}
            className="sm:border-r sm:border-slate-200 sm:pr-6"
          />
          <RelatedBlock
            title={
              <>
                Presets using {label} in{' '}
                <code className={areaInlineCodeClass('presets')}>moreFields</code>
              </>
            }
            count={morePresets.length}
            titleFilter={onFilterMorePresets}
            presets={morePresets.map(toRelatedItem)}
            className="sm:pl-2"
          />
        </div>
      </DetailDisclosure>
    </div>
  )
}
