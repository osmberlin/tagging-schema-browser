import { FieldOptionsPreview } from '@/components/PagePresets/FieldOptionsPreview'
import { useLocale } from '@/hooks/useLocale'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { getPresetFieldSections } from '@/utils/fieldOptions'
import { hasFieldOptionTranslation } from '@/utils/fieldOptionTranslation'
import type { DenormalizedPreset } from '@/utils/types'

export function FieldSourceEnrichment({
  fieldId,
  preset,
  presets,
}: {
  fieldId: string
  preset: DenormalizedPreset
  presets: DenormalizedPreset[]
}) {
  const { locale, fieldLocaleMap } = useLocale()
  const { fields, fieldTranslations } = useSchema()
  const section = getPresetFieldSections(preset, fields, fieldTranslations, presets).find(
    (s) => s.fieldId === fieldId,
  )

  if (!section) return null

  const optionRows = section.options.filter((row) => {
    const strings = fieldTranslations[fieldId]?.options ?? {}
    return Boolean(
      row.icon || hasFieldOptionTranslation(strings[row.optionValue]) || row.childPreset,
    )
  })

  if (optionRows.length === 0) return null

  return (
    <div className="mt-2 mb-2 ml-5 max-w-2xl space-y-2 border-l-2 border-emerald-100 pl-4 font-sans">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="font-medium text-slate-800">{section.labelEn}</span>
        {section.inPrimary ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${areaAccent.fields.sharedChip}`}
          >
            primary
          </span>
        ) : null}
        {section.inMore && !section.inPrimary ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            more fields
          </span>
        ) : null}
      </div>
      <FieldOptionsPreview options={optionRows} locale={locale} fieldLocaleMap={fieldLocaleMap} />
    </div>
  )
}
