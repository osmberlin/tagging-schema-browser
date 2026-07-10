import { useParams } from '@tanstack/react-router'
import { FieldOptionIconsTable } from '@/components/PageFields/FieldOptionIconsTable'
import { FieldTranslationTable } from '@/components/PageFields/FieldTranslationTable'
import { GeometryIcons } from '@/components/PagePresets/geometryIcons'
import { PresetSourceTree } from '@/components/PagePresets/PresetSourceTree'
import { presetSearchDefaults, useSetPreset } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { AreaLink } from '@/components/ui/AreaLink'
import { DetailDisclosure } from '@/components/ui/DetailDisclosure'
import { RelatedBlock } from '@/components/ui/RelatedBlock'
import { SchemaIssueDisclosure } from '@/components/ui/SchemaIssue'
import { useLocale } from '@/hooks/useLocale'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { externalAccent, externalPillClass } from '@/theme/externalAccent'
import { getFieldOptionMismatchRows } from '@/utils/fieldOptions'
import { fieldTypeHint } from '@/utils/fieldTypes'
import { githubFileUrl, schemaRepoPath } from '@/utils/githubFileUrl'
import { formatPrerequisiteTag, parsePrerequisiteTag } from '@/utils/prerequisiteTag'
import type { DenormalizedPreset, RawFieldTranslation } from '@/utils/types'

type RelatedItem = { id: string; name: string }

export function FieldDetailPage() {
  const { _splat: fieldId } = useParams({ strict: false })
  const { fields, presets, dataUrl, data, loading, error } = useSchema()
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

  if (loading || !data) {
    return <p className="text-sm text-slate-600">Loading schema…</p>
  }

  if (!raw) {
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

  const primaryPresets = presets.filter((p) => p.fields.includes(fieldId))
  const morePresets = presets.filter(
    (p) => p.moreFields.includes(fieldId) && !p.fields.includes(fieldId),
  )

  return (
    <FieldDetailContent
      fieldId={fieldId}
      raw={raw as Record<string, unknown>}
      english={english}
      primaryPresets={primaryPresets}
      morePresets={morePresets}
      dataUrl={dataUrl ?? ''}
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
}: {
  fieldId: string
  raw: Record<string, unknown>
  english: RawFieldTranslation
  primaryPresets: DenormalizedPreset[]
  morePresets: DenormalizedPreset[]
  dataUrl: string
}) {
  const setPreset = useSetPreset()
  const { fields, presets, fieldTranslations } = useSchema()
  const { locale, fieldLocaleMap, loading: localeLoading, error: localeError } = useLocale()
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

  const toItem = (p: DenormalizedPreset): RelatedItem => ({ id: p.id, name: p.name })
  const optionRows = getFieldOptionMismatchRows(fieldId, fields, fieldTranslations, presets)
  const mismatchCount = optionRows.filter((row) => row.iconMismatch).length

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ring-emerald-100 ring-inset ${areaAccent.fields.iconBg}`}
          >
            <AreaIcon area="fields" className="h-8 w-8" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-slate-950">{label}</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">{fieldId}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
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
            </div>
            {prerequisiteTag ? (
              <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                <span className="font-medium">Visibility: </span>
                {formatPrerequisiteTag(prerequisiteTag)}
              </p>
            ) : null}
            {geometry.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Geometry</span>
                <GeometryIcons geometry={geometry} />
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={externalAccent.button}
          >
            View source ↗
          </a>
          <AreaLink
            area="presets"
            to="/"
            search={(prev) => ({
              ...presetSearchDefaults,
              dataUrl: prev.dataUrl ?? '',
              locale: prev.locale ?? '',
              fieldIds: [fieldId],
              page: 1,
            })}
            className="text-xs"
          >
            Filter presets using this field
          </AreaLink>
        </div>
      </header>

      {mismatchCount > 0 ? (
        <SchemaIssueDisclosure
          disclosureId={`field-icon-mismatch:${fieldId}`}
          variant="warning"
          title="Icon mismatch"
          summary={`${mismatchCount} option${mismatchCount === 1 ? '' : 's'} use a different icon than the linked child preset${mismatchCount === 1 ? '' : 's'}`}
          defaultOpen
        >
          <FieldOptionIconsTable rows={optionRows} onOpenPreset={setPreset} />
        </SchemaIssueDisclosure>
      ) : (
        <DetailDisclosure
          title="Option icons"
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
              className={externalPillClass()}
            >
              GitHub ↗
            </a>
          </>
        }
        defaultOpen
      >
        <PresetSourceTree presetId={fieldId} raw={raw} sourceKind="field" />
      </DetailDisclosure>

      <DetailDisclosure title="Related presets" area="presets" defaultOpen>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <RelatedBlock
            title="Presets with this field (primary)"
            count={primaryPresets.length}
            titleFilter={onFilterPrimaryPresets}
            presets={primaryPresets.map(toItem)}
          />
          <RelatedBlock
            title="Presets with this field (more fields)"
            count={morePresets.length}
            titleFilter={onFilterMorePresets}
            presets={morePresets.map(toItem)}
          />
        </div>
      </DetailDisclosure>
    </div>
  )
}
