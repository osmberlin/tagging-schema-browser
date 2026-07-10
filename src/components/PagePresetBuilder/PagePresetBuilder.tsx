import { useStore } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { StringListEditor, TagKeyValueEditor } from '@/components/PagePresetBuilder/BuilderEditors'
import { BuilderSectionDisclosure } from '@/components/PagePresetBuilder/BuilderSectionDisclosure'
import { IconFieldInput } from '@/components/PagePresetBuilder/IconFieldInput'
import {
  BUILDER_SECTION_META,
  sectionOpenWhen,
} from '@/components/PagePresetBuilder/presetBuilderSections'
import type { PresetBuilderState } from '@/components/PagePresetBuilder/presetBuilderTypes'
import { GEOMETRY_OPTIONS } from '@/components/PagePresetBuilder/presetBuilderUtils'
import {
  buildRawPreset,
  buildTranslationSnippet,
  formatPresetJson,
  isPresetRef,
  presetIdFromTags,
  presetRepoPath,
} from '@/components/PagePresetBuilder/presetBuilderUtils'
import { RegionMultiSelect } from '@/components/PagePresetBuilder/RegionMultiSelect'
import { usePresetBuilderForm } from '@/components/PagePresetBuilder/usePresetBuilderForm'
import { GeometryIcons } from '@/components/PagePresets/geometryIcons'
import {
  detectMissingFieldInheritance,
  parentPresetId,
} from '@/components/PagePresets/missingFieldInheritance'
import { MissingInheritancePanel } from '@/components/PagePresets/MissingInheritancePanel'
import { resolvePresetFieldList } from '@/components/PagePresets/presetFieldInheritance'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { Input } from '@/components/ui/Input'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import type { DenormalizedPreset, RawFields, RawPreset } from '@/utils/types'

function builderPreviewPreset(
  presetId: string,
  raw: RawPreset,
  state: PresetBuilderState,
  rawPresets: Record<string, RawPreset>,
  allFields: RawFields,
  missingFieldInheritance: ReturnType<typeof detectMissingFieldInheritance>,
): DenormalizedPreset {
  const resolvedFields =
    raw.fields !== undefined
      ? resolvePresetFieldList(presetId, raw, 'fields', rawPresets, allFields)
      : parentPresetId(presetId)
        ? resolvePresetFieldList(
            parentPresetId(presetId)!,
            rawPresets[parentPresetId(presetId)!] ?? {},
            'fields',
            rawPresets,
            allFields,
          )
        : []

  const displayName = isPresetRef(state.name)
    ? `(inherits ${state.name})`
    : state.name.trim() || presetId

  const tagEntries = Object.entries(state.tags)

  return {
    id: presetId,
    name: displayName,
    terms: state.terms,
    aliases: state.aliases,
    icon: state.icon.trim() || undefined,
    geometry: state.geometry,
    tags: state.tags,
    tagString: tagEntries.map(([k, v]) => `${k}=${v}`).join(' '),
    fields: resolvedFields,
    moreFields: state.moreFields,
    primaryTagKey: tagEntries.sort(([a], [b]) => a.localeCompare(b))[0]?.[0],
    primaryTagValue: tagEntries.sort(([a], [b]) => a.localeCompare(b))[0]?.[1],
    categoryIds: [],
    categoryNames: [],
    matchScore: Number.parseFloat(state.matchScore) || 1,
    hasIcon: Boolean(state.icon.trim()),
    iconMismatch: false,
    missingFieldInheritance,
    missingInheritanceStatus: missingFieldInheritance ? 'unreviewed' : 'none',
    searchable: state.searchable,
  }
}

function usePrefillFromPreset(
  fromPresetId: string,
  committedTags: Record<string, string>,
  commitToUrl: (values: PresetBuilderState) => void,
  defaults: PresetBuilderState,
) {
  const { rawPresets, data } = useSchema()

  useEffect(() => {
    if (!fromPresetId.trim()) return
    const preset = rawPresets[fromPresetId]
    if (!preset) return

    const translations = data?.translations?.en?.presets?.presets?.[fromPresetId]
    const alreadyFilled = Object.keys(committedTags).length > 0
    if (alreadyFilled) return

    commitToUrl({
      ...defaults,
      name: translations?.name ?? (typeof preset.name === 'string' ? preset.name : ''),
      icon: preset.icon ?? '',
      searchable: preset.searchable !== false,
      tags: { ...preset.tags },
      geometry: [...(preset.geometry ?? [])],
      fields: preset.fields ? [...preset.fields] : [],
      moreFields: preset.moreFields ? [...preset.moreFields] : [],
      terms: Array.isArray(translations?.terms)
        ? translations.terms
        : typeof translations?.terms === 'string'
          ? translations.terms.split(',').map((t) => t.trim())
          : [],
      aliases: Array.isArray(translations?.aliases)
        ? translations.aliases
        : typeof translations?.aliases === 'string'
          ? translations.aliases.split('\n').map((a) => a.trim())
          : [],
      addTags: { ...preset.addTags },
      removeTags: { ...preset.removeTags },
      matchScore: preset.matchScore !== undefined ? String(preset.matchScore) : '',
      referenceKey: preset.reference?.key ?? '',
      referenceValue: preset.reference?.value ?? '',
      locationSetInclude: [...(preset.locationSet?.include ?? [])],
      locationSetExclude: [...(preset.locationSet?.exclude ?? [])],
      locationSetCrossReference: preset.locationSetCrossReference ?? '',
      relation: preset.relation ?? '',
      relationCrossReference: preset.relationCrossReference ?? '',
    })
  }, [fromPresetId, rawPresets, data, commitToUrl, committedTags, defaults])
}

export function PagePresetBuilder() {
  const {
    form,
    committedState,
    committedKey,
    fromPresetId,
    isDirty,
    commitToUrl,
    commitDraft,
    commitAndSet,
    defaults,
  } = usePresetBuilderForm()
  const { rawPresets, fields, dataUrl } = useSchema()

  usePrefillFromPreset(fromPresetId, committedState.tags, commitToUrl, defaults)

  const draftPresetId = useStore(form.store, (state) => presetIdFromTags(state.values.tags))
  const committedPresetId = presetIdFromTags(committedState.tags)
  const parentId = draftPresetId ? parentPresetId(draftPresetId) : null

  const committedRawPreset = useMemo(() => buildRawPreset(committedState), [committedState])
  const presetJson = useMemo(() => formatPresetJson(committedRawPreset), [committedRawPreset])
  const translationSnippet = useMemo(
    () =>
      committedPresetId
        ? buildTranslationSnippet(committedPresetId, {
            name: isPresetRef(committedState.name) ? '' : committedState.name,
            terms: committedState.terms,
            aliases: committedState.aliases,
          })
        : '',
    [committedPresetId, committedState.name, committedState.terms, committedState.aliases],
  )

  const missingInheritance = useMemo(() => {
    if (!committedPresetId) return null
    return detectMissingFieldInheritance(committedPresetId, committedRawPreset, rawPresets, fields)
  }, [committedPresetId, committedRawPreset, rawPresets, fields])

  const previewPreset = useMemo(() => {
    if (!committedPresetId) return null
    return builderPreviewPreset(
      committedPresetId,
      committedRawPreset,
      committedState,
      rawPresets,
      fields,
      missingInheritance,
    )
  }, [
    committedPresetId,
    committedRawPreset,
    committedState,
    rawPresets,
    fields,
    missingInheritance,
  ])

  const duplicateId = draftPresetId && rawPresets[draftPresetId] && !fromPresetId
  const sectionOpen = (section: Parameters<typeof sectionOpenWhen>[0]) =>
    sectionOpenWhen(section, committedState)

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-rose-700">Preset builder</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Draft a preset JSON file with live preview and export. Edits are saved to the URL when you
          leave a field — share or bookmark the page to continue later.
        </p>
        {isDirty ? (
          <p className="mt-2 text-sm font-medium text-amber-800">
            Unsaved edits — preview and export reflect the last saved URL state until you blur a
            field.
          </p>
        ) : null}
      </header>

      <BuilderSectionDisclosure
        title="Identity"
        description="Tags define the preset id and repository file path. Main presets have one tag key; sub-presets add more."
        alwaysOpen
      >
        <div className="space-y-4">
          <form.Field name="tags">
            {(field) => (
              <TagKeyValueEditor
                key={committedKey}
                tags={field.state.value}
                onChange={(tags) => field.handleChange(tags)}
                onCommit={() => {
                  field.handleBlur()
                  commitDraft()
                }}
              />
            )}
          </form.Field>
          {draftPresetId ? (
            <dl className="space-y-2 rounded-lg bg-slate-50 px-3 py-3 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-slate-700">Preset id</dt>
                <dd className="font-mono text-slate-900">{draftPresetId}</dd>
              </div>
              <form.Field name="searchable">
                {(field) => (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-medium text-slate-700">File</dt>
                    <dd className="font-mono text-slate-900">
                      {presetRepoPath(draftPresetId, field.state.value)}
                    </dd>
                  </div>
                )}
              </form.Field>
              <form.Field name="searchable">
                {(field) =>
                  !field.state.value ? (
                    <p className="text-slate-600">
                      Refs use <code className="font-mono text-xs">{`{${draftPresetId}}`}</code> (no
                      underscore in refs).
                    </p>
                  ) : null
                }
              </form.Field>
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    parentId
                      ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-100 ring-inset'
                      : 'bg-rose-50 text-rose-800 ring-1 ring-rose-100 ring-inset'
                  }`}
                >
                  {parentId ? `Sub-preset of ${parentId}` : 'Main preset'}
                </span>
              </div>
              {duplicateId ? (
                <p className="text-amber-800">
                  A preset with this id already exists in the loaded schema.{' '}
                  <Link
                    to="/preset/$"
                    params={{ _splat: draftPresetId }}
                    search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                    className="font-medium text-rose-600 hover:underline"
                  >
                    View existing preset
                  </Link>
                </p>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Add at least one tag to derive the preset id.</p>
          )}
          <form.Field name="searchable">
            {(field) => (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(event) => {
                    field.handleChange(event.target.checked)
                    commitAndSet('searchable', event.target.checked)
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                Searchable (uncheck for <code className="font-mono text-xs">_filename</code>{' '}
                convention)
              </label>
            )}
          </form.Field>
        </div>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure {...BUILDER_SECTION_META.labels} openWhen={sectionOpen('labels')}>
        <div className="space-y-4">
          <form.Field name="name">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-900">Name</label>
                <Input
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={() => {
                    field.handleBlur()
                    commitDraft()
                  }}
                  placeholder="Café or {shop}"
                  className="mt-1.5"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="terms">
            {(field) => (
              <StringListEditor
                label="Terms (search keywords)"
                values={field.state.value}
                onChange={(terms) => field.handleChange(terms)}
                onBlur={() => {
                  field.handleBlur()
                  commitDraft()
                }}
                placeholder="coffee&#10;espresso"
              />
            )}
          </form.Field>
          <form.Field name="aliases">
            {(field) => (
              <StringListEditor
                label="Aliases"
                values={field.state.value}
                onChange={(aliases) => field.handleChange(aliases)}
                onBlur={() => {
                  field.handleBlur()
                  commitDraft()
                }}
                placeholder="One synonym per line"
              />
            )}
          </form.Field>
        </div>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.appearance}
        openWhen={sectionOpen('appearance')}
      >
        <form.Field name="icon">
          {(field) => (
            <IconFieldInput
              value={field.state.value}
              onChange={(icon) => field.handleChange(icon)}
              onBlur={() => {
                field.handleBlur()
                commitDraft()
              }}
              dataUrl={dataUrl ?? ''}
            />
          )}
        </form.Field>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.geometry}
        openWhen={sectionOpen('geometry')}
      >
        <form.Field name="geometry">
          {(field) => (
            <div className="flex flex-wrap gap-3">
              {GEOMETRY_OPTIONS.map((geometry) => {
                const checked = field.state.value.includes(geometry)
                return (
                  <label
                    key={geometry}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      checked
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? field.state.value.filter((g) => g !== geometry)
                          : [...field.state.value, geometry]
                        field.handleChange(next)
                        commitAndSet('geometry', next)
                      }}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <GeometryIcons geometry={[geometry]} className="h-4 w-4" />
                    <span className="font-mono text-xs">{geometry}</span>
                  </label>
                )
              })}
            </div>
          )}
        </form.Field>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure {...BUILDER_SECTION_META.fields} openWhen={sectionOpen('fields')}>
        <div className="space-y-4">
          <form.Field name="fields">
            {(field) => (
              <StringListEditor
                label="fields"
                values={field.state.value}
                onChange={(nextFields) => field.handleChange(nextFields)}
                onBlur={() => {
                  field.handleBlur()
                  commitDraft()
                }}
                hint="Add {parent} when overriding a sub-preset list."
              />
            )}
          </form.Field>
          {previewPreset ? <MissingInheritancePanel preset={previewPreset} /> : null}
        </div>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.moreFields}
        openWhen={sectionOpen('moreFields')}
      >
        <form.Field name="moreFields">
          {(field) => (
            <StringListEditor
              label="moreFields"
              values={field.state.value}
              onChange={(moreFields) => field.handleChange(moreFields)}
              onBlur={() => {
                field.handleBlur()
                commitDraft()
              }}
            />
          )}
        </form.Field>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.tagOverrides}
        openWhen={sectionOpen('tagOverrides')}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-900">addTags</h3>
            <div className="mt-2">
              <form.Field name="addTags">
                {(addField) => (
                  <TagKeyValueEditor
                    key={committedKey}
                    tags={addField.state.value}
                    onChange={(addTags) => addField.handleChange(addTags)}
                    onCommit={() => {
                      addField.handleBlur()
                      commitDraft()
                    }}
                  />
                )}
              </form.Field>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">removeTags</h3>
            <div className="mt-2">
              <form.Field name="removeTags">
                {(removeField) => (
                  <TagKeyValueEditor
                    key={committedKey}
                    tags={removeField.state.value}
                    onChange={(removeTags) => removeField.handleChange(removeTags)}
                    onCommit={() => {
                      removeField.handleBlur()
                      commitDraft()
                    }}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.matchScore}
        openWhen={sectionOpen('matchScore')}
      >
        <form.Field name="matchScore">
          {(field) => (
            <div>
              <label className="block text-sm font-medium text-slate-900">matchScore</label>
              <Input
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={() => {
                  field.handleBlur()
                  commitDraft()
                }}
                placeholder="1.0"
                className="mt-1.5 max-w-xs"
              />
            </div>
          )}
        </form.Field>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.reference}
        openWhen={sectionOpen('reference')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field name="referenceKey">
            {(keyField) => (
              <div>
                <label className="block text-sm font-medium text-slate-900">reference key</label>
                <Input
                  value={keyField.state.value}
                  onChange={(event) => keyField.handleChange(event.target.value)}
                  onBlur={() => {
                    keyField.handleBlur()
                    commitDraft()
                  }}
                  className="mt-1.5"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="referenceValue">
            {(valueField) => (
              <div>
                <label className="block text-sm font-medium text-slate-900">reference value</label>
                <Input
                  value={valueField.state.value}
                  onChange={(event) => valueField.handleChange(event.target.value)}
                  onBlur={() => {
                    valueField.handleBlur()
                    commitDraft()
                  }}
                  className="mt-1.5"
                />
              </div>
            )}
          </form.Field>
        </div>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.locationSet}
        openWhen={sectionOpen('locationSet')}
      >
        <div className="space-y-6">
          <form.Field name="locationSetInclude">
            {(includeField) => (
              <RegionMultiSelect
                label="locationSet — include"
                selected={includeField.state.value}
                onChange={(locationSetInclude) => {
                  includeField.handleChange(locationSetInclude)
                  commitAndSet('locationSetInclude', locationSetInclude)
                }}
              />
            )}
          </form.Field>
          <form.Field name="locationSetExclude">
            {(excludeField) => (
              <RegionMultiSelect
                label="locationSet — exclude"
                selected={excludeField.state.value}
                onChange={(locationSetExclude) => {
                  excludeField.handleChange(locationSetExclude)
                  commitAndSet('locationSetExclude', locationSetExclude)
                }}
              />
            )}
          </form.Field>
          <form.Field name="locationSetCrossReference">
            {(crossField) => (
              <div>
                <label className="block text-sm font-medium text-slate-900">
                  locationSetCrossReference
                </label>
                <Input
                  value={crossField.state.value}
                  onChange={(event) => crossField.handleChange(event.target.value)}
                  onBlur={() => {
                    crossField.handleBlur()
                    commitDraft()
                  }}
                  placeholder="{presets/man_made/crane}"
                  className="mt-1.5 font-mono text-sm"
                />
              </div>
            )}
          </form.Field>
        </div>
      </BuilderSectionDisclosure>

      <BuilderSectionDisclosure
        {...BUILDER_SECTION_META.relation}
        openWhen={sectionOpen('relation')}
      >
        <div className="space-y-4">
          <form.Field name="relation">
            {(relationField) => (
              <div>
                <label className="block text-sm font-medium text-slate-900">relation</label>
                <Input
                  value={relationField.state.value}
                  onChange={(event) => relationField.handleChange(event.target.value)}
                  onBlur={() => {
                    relationField.handleBlur()
                    commitDraft()
                  }}
                  className="mt-1.5 font-mono text-sm"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="relationCrossReference">
            {(relationCrossField) => (
              <div>
                <label className="block text-sm font-medium text-slate-900">
                  relationCrossReference
                </label>
                <Input
                  value={relationCrossField.state.value}
                  onChange={(event) => relationCrossField.handleChange(event.target.value)}
                  onBlur={() => {
                    relationCrossField.handleBlur()
                    commitDraft()
                  }}
                  className="mt-1.5 font-mono text-sm"
                />
              </div>
            )}
          </form.Field>
        </div>
      </BuilderSectionDisclosure>

      {previewPreset ? (
        <BuilderSectionDisclosure
          {...BUILDER_SECTION_META.preview}
          openWhen={Boolean(committedPresetId)}
        >
          <div className="flex items-start gap-4">
            <PresetIconBox preset={previewPreset} size="md" />
            <div className="min-w-0 space-y-2">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                {previewPreset.name}
              </h3>
              <p className="font-mono text-xs text-slate-500">{previewPreset.id}</p>
              <GeometryIcons geometry={previewPreset.geometry} />
              {previewPreset.fields.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {previewPreset.fields.map((fieldId) => (
                    <li
                      key={fieldId}
                      className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700"
                    >
                      {fieldId}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No fields resolved yet.</p>
              )}
            </div>
          </div>
        </BuilderSectionDisclosure>
      ) : null}

      <BuilderSectionDisclosure {...BUILDER_SECTION_META.export} alwaysOpen>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">Preset file</h3>
            {committedPresetId ? (
              <p className="mt-1 font-mono text-xs text-slate-500">
                {presetRepoPath(committedPresetId, committedState.searchable)}
              </p>
            ) : null}
            <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">
              {presetJson}
            </pre>
            <CopyButton text={presetJson} label="Copy preset JSON" />
          </div>
          {translationSnippet ? (
            <div>
              <h3 className="text-sm font-medium text-slate-900">English translation snippet</h3>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">
                {translationSnippet}
              </pre>
              <CopyButton text={translationSnippet} label="Copy translation snippet" />
            </div>
          ) : null}
        </div>
      </BuilderSectionDisclosure>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }}
      className={`mt-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white ${areaAccent.presets.button}`}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
