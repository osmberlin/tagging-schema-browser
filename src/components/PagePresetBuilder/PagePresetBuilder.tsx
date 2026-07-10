import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ShareLinkButton,
  StringListEditor,
  TagKeyValueEditor,
} from '@/components/PagePresetBuilder/BuilderEditors'
import { IconFieldInput } from '@/components/PagePresetBuilder/IconFieldInput'
import {
  GEOMETRY_OPTIONS,
  buildRawPreset,
  buildTranslationSnippet,
  formatPresetJson,
  isPresetRef,
  presetIdFromTags,
  presetRepoPath,
  type PresetBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderUtils'
import { RegionMultiSelect } from '@/components/PagePresetBuilder/RegionMultiSelect'
import { usePresetBuilderState } from '@/components/PagePresetBuilder/usePresetBuilderState'
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

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-8">
      <div>
        <h2 className="font-display text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="rounded-xl bg-white p-5 shadow-xs outline outline-slate-900/5">
        {children}
      </div>
    </section>
  )
}

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

function usePrefillFromPreset(fromPresetId: string) {
  const { rawPresets, data } = useSchema()
  const { state, setState, search } = usePresetBuilderState()

  useEffect(() => {
    if (!fromPresetId.trim()) return
    const preset = rawPresets[fromPresetId]
    if (!preset) return

    const translations = data?.translations?.en?.presets?.presets?.[fromPresetId]
    const alreadyFilled = Object.keys(state.tags).length > 0
    if (alreadyFilled && search.pb_from !== fromPresetId) return

    setState({
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
  }, [fromPresetId, rawPresets, data, setState, state.tags, search.pb_from])
}

export function PagePresetBuilder() {
  const { state, setState, fromPresetId } = usePresetBuilderState()
  const { rawPresets, fields, dataUrl } = useSchema()
  usePrefillFromPreset(fromPresetId)

  const presetId = presetIdFromTags(state.tags)
  const parentId = presetId ? parentPresetId(presetId) : null
  const rawPreset = useMemo(() => buildRawPreset(state), [state])
  const presetJson = useMemo(() => formatPresetJson(rawPreset), [rawPreset])
  const translationSnippet = useMemo(
    () =>
      presetId
        ? buildTranslationSnippet(presetId, {
            name: isPresetRef(state.name) ? '' : state.name,
            terms: state.terms,
            aliases: state.aliases,
          })
        : '',
    [presetId, state.name, state.terms, state.aliases],
  )

  const missingInheritance = useMemo(() => {
    if (!presetId) return null
    return detectMissingFieldInheritance(presetId, rawPreset, rawPresets, fields)
  }, [presetId, rawPreset, rawPresets, fields])

  const previewPreset = useMemo(() => {
    if (!presetId) return null
    return builderPreviewPreset(presetId, rawPreset, state, rawPresets, fields, missingInheritance)
  }, [presetId, rawPreset, state, rawPresets, fields, missingInheritance])

  const duplicateId = presetId && rawPresets[presetId] && !fromPresetId

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-rose-700">Preset builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Draft a preset JSON file with live preview and export. Form state is stored in the URL —
            copy the link to share or continue later.
          </p>
        </div>
        <ShareLinkButton />
      </header>

      <FormSection
        title="Identity"
        description="Tags define the preset id and repository file path. Main presets have one tag key; sub-presets add more."
      >
        <div className="space-y-4">
          <TagKeyValueEditor tags={state.tags} onChange={(tags) => setState({ tags })} />
          {presetId ? (
            <dl className="space-y-2 rounded-lg bg-slate-50 px-3 py-3 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-slate-700">Preset id</dt>
                <dd className="font-mono text-slate-900">{presetId}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-slate-700">File</dt>
                <dd className="font-mono text-slate-900">
                  {presetRepoPath(presetId, state.searchable)}
                </dd>
              </div>
              {!state.searchable ? (
                <p className="text-slate-600">
                  Refs use <code className="font-mono text-xs">{`{${presetId}}`}</code> (no
                  underscore in refs).
                </p>
              ) : null}
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
                    params={{ _splat: presetId }}
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
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={state.searchable}
              onChange={(event) => setState({ searchable: event.target.checked })}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            Searchable (uncheck for <code className="font-mono text-xs">_filename</code> convention)
          </label>
        </div>
      </FormSection>

      <FormSection
        title="Labels"
        description="Display name goes in translation files. Use {parent} to inherit from a slash-parent preset."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900">Name</label>
            <Input
              value={state.name}
              onChange={(event) => setState({ name: event.target.value })}
              placeholder="Café or {shop}"
              className="mt-1.5"
            />
          </div>
          <StringListEditor
            label="Terms (search keywords)"
            values={state.terms}
            onChange={(terms) => setState({ terms })}
            placeholder="coffee&#10;espresso"
          />
          <StringListEditor
            label="Aliases"
            values={state.aliases}
            onChange={(aliases) => setState({ aliases })}
            placeholder="One synonym per line"
          />
        </div>
      </FormSection>

      <FormSection
        title="Appearance"
        description="Pick an icon name from the Icons page. imageURL is not offered here."
      >
        <IconFieldInput
          value={state.icon}
          onChange={(icon) => setState({ icon })}
          dataUrl={dataUrl ?? ''}
        />
      </FormSection>

      <FormSection title="Geometry" description="Where this preset can be used in the editor.">
        <div className="flex flex-wrap gap-3">
          {GEOMETRY_OPTIONS.map((geometry) => {
            const checked = state.geometry.includes(geometry)
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
                      ? state.geometry.filter((g) => g !== geometry)
                      : [...state.geometry, geometry]
                    setState({ geometry: next })
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <GeometryIcons geometry={[geometry]} className="h-4 w-4" />
                <span className="font-mono text-xs">{geometry}</span>
              </label>
            )
          })}
        </div>
      </FormSection>

      <FormSection
        title="Fields"
        description="One entry per line. Use field ids or preset refs like {shop} to include a parent list."
      >
        <div className="space-y-4">
          <StringListEditor
            label="fields"
            values={state.fields}
            onChange={(fields) => setState({ fields })}
            hint="Add {parent} when overriding a sub-preset list."
          />
          {previewPreset ? <MissingInheritancePanel preset={previewPreset} /> : null}
        </div>
      </FormSection>

      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setState({ advancedOpen: !state.advancedOpen })}
          className="text-sm font-medium text-rose-600 hover:text-rose-700"
        >
          {state.advancedOpen ? 'Hide advanced options' : 'Show advanced options'}
        </button>
        {state.advancedOpen ? (
          <div className="space-y-8 rounded-xl bg-white p-5 shadow-xs outline outline-slate-900/5">
            <StringListEditor
              label="moreFields"
              values={state.moreFields}
              onChange={(moreFields) => setState({ moreFields })}
            />
            <div>
              <h3 className="text-sm font-medium text-slate-900">addTags</h3>
              <div className="mt-2">
                <TagKeyValueEditor
                  tags={state.addTags}
                  onChange={(addTags) => setState({ addTags })}
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">removeTags</h3>
              <div className="mt-2">
                <TagKeyValueEditor
                  tags={state.removeTags}
                  onChange={(removeTags) => setState({ removeTags })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">matchScore</label>
              <Input
                value={state.matchScore}
                onChange={(event) => setState({ matchScore: event.target.value })}
                placeholder="1.0"
                className="mt-1.5 max-w-xs"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-900">reference key</label>
                <Input
                  value={state.referenceKey}
                  onChange={(event) => setState({ referenceKey: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900">reference value</label>
                <Input
                  value={state.referenceValue}
                  onChange={(event) => setState({ referenceValue: event.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <RegionMultiSelect
              label="locationSet — include"
              selected={state.locationSetInclude}
              onChange={(locationSetInclude) => setState({ locationSetInclude })}
            />
            <RegionMultiSelect
              label="locationSet — exclude"
              selected={state.locationSetExclude}
              onChange={(locationSetExclude) => setState({ locationSetExclude })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-900">
                locationSetCrossReference
              </label>
              <Input
                value={state.locationSetCrossReference}
                onChange={(event) => setState({ locationSetCrossReference: event.target.value })}
                placeholder="{presets/man_made/crane}"
                className="mt-1.5 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">relation</label>
              <Input
                value={state.relation}
                onChange={(event) => setState({ relation: event.target.value })}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">
                relationCrossReference
              </label>
              <Input
                value={state.relationCrossReference}
                onChange={(event) => setState({ relationCrossReference: event.target.value })}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
          </div>
        ) : null}
      </section>

      {previewPreset ? (
        <FormSection title="Preview" description="How the preset will look in the browser.">
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
        </FormSection>
      ) : null}

      <FormSection
        title="Export"
        description="Copy JSON into your id-tagging-schema pull request. English labels go in translations."
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">Preset file</h3>
            {presetId ? (
              <p className="mt-1 font-mono text-xs text-slate-500">
                {presetRepoPath(presetId, state.searchable)}
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
      </FormSection>
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
