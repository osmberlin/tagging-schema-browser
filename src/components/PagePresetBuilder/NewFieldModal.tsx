import { useMemo, useState } from 'react'
import { GEOMETRY_OPTIONS } from '@/components/PagePresetBuilder/presetBuilderUtils'
import { CatalystDialog, CatalystDialogBody, CatalystDialogTitle } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { sortFieldTypes } from '@/utils/fieldTypes'
import type { PrerequisiteTag } from '@/utils/prerequisiteTag'
import type { RawField } from '@/utils/types'

export type NewFieldDraft = {
  id: string
  key: string
  type: string
  label: string
  placeholder: string
  universal: boolean
  geometry: string[]
  optionsText: string
  prerequisiteKey: string
  prerequisiteValuesText: string
  addToFields: boolean
}

export const EMPTY_NEW_FIELD_DRAFT: NewFieldDraft = {
  id: '',
  key: '',
  type: 'text',
  label: '',
  placeholder: '',
  universal: false,
  geometry: [],
  optionsText: '',
  prerequisiteKey: '',
  prerequisiteValuesText: '',
  addToFields: true,
}

function parseOptionsText(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function buildPrerequisiteTag(draft: NewFieldDraft): PrerequisiteTag | undefined {
  const key = draft.prerequisiteKey.trim()
  const values = parseOptionsText(draft.prerequisiteValuesText)
  if (!key || values.length === 0) return undefined
  return values.length === 1 ? { key, value: values[0] } : { key, values }
}

export function draftToRawField(draft: NewFieldDraft): RawField | null {
  const id = draft.id.trim()
  if (!id) return null

  const field: RawField = {}
  const key = draft.key.trim() || id
  if (key !== id) field.key = key

  if (draft.type.trim()) field.type = draft.type.trim()
  if (draft.label.trim()) field.label = draft.label.trim()
  if (draft.placeholder.trim()) field.placeholder = draft.placeholder.trim()
  if (draft.universal) field.universal = true
  if (draft.geometry.length > 0) field.geometry = [...draft.geometry]

  const options = parseOptionsText(draft.optionsText)
  if (options.length > 0) field.options = options

  const prerequisiteTag = buildPrerequisiteTag(draft)
  if (prerequisiteTag) field.prerequisiteTag = prerequisiteTag

  return field
}

export function formatFieldJson(field: RawField): string {
  return `${JSON.stringify(field, null, 2)}\n`
}

type NewFieldModalProps = {
  open: boolean
  onClose: () => void
  onSave: (id: string, field: RawField, addToFields: boolean) => void
  existingFieldIds: Set<string>
  fieldTypes: string[]
}

export function NewFieldModal({
  open,
  onClose,
  onSave,
  existingFieldIds,
  fieldTypes,
}: NewFieldModalProps) {
  const [draft, setDraft] = useState<NewFieldDraft>(EMPTY_NEW_FIELD_DRAFT)
  const [error, setError] = useState<string | null>(null)

  const types = useMemo(() => sortFieldTypes(fieldTypes), [fieldTypes])
  const preview = useMemo(() => draftToRawField(draft), [draft])

  const resetAndClose = () => {
    setDraft(EMPTY_NEW_FIELD_DRAFT)
    setError(null)
    onClose()
  }

  const handleSave = () => {
    const id = draft.id.trim()
    if (!id) {
      setError('Field id is required (e.g. healthcare/speciality).')
      return
    }
    if (existingFieldIds.has(id)) {
      setError(`A field with id "${id}" already exists in the schema or your drafts.`)
      return
    }
    const field = draftToRawField(draft)
    if (!field) return
    onSave(id, field, draft.addToFields)
    resetAndClose()
  }

  return (
    <CatalystDialog open={open} onClose={resetAndClose} size="3xl">
      <CatalystDialogTitle className="font-display">Create new field</CatalystDialogTitle>
      <CatalystDialogBody className="space-y-5">
        <p className="text-sm text-slate-600">
          Draft a field JSON file for your pull request. The field is saved in the builder URL and
          exported alongside the preset.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-900">Field id</label>
            <Input
              value={draft.id}
              onChange={(event) => setDraft((prev) => ({ ...prev, id: event.target.value }))}
              placeholder="healthcare/speciality"
              className="mt-1.5 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">Becomes data/fields/{'{id}'}.json</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">OSM tag key</label>
            <Input
              value={draft.key}
              onChange={(event) => setDraft((prev) => ({ ...prev, key: event.target.value }))}
              placeholder="healthcare:speciality"
              className="mt-1.5 font-mono text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-900">Type</label>
            <select
              value={draft.type}
              onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Label</label>
            <Input
              value={draft.label}
              onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))}
              placeholder="Speciality"
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900">Placeholder</label>
          <Input
            value={draft.placeholder}
            onChange={(event) => setDraft((prev) => ({ ...prev, placeholder: event.target.value }))}
            className="mt-1.5"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.universal}
            onChange={(event) => setDraft((prev) => ({ ...prev, universal: event.target.checked }))}
            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          Universal (shown on all presets)
        </label>

        <div>
          <span className="block text-sm font-medium text-slate-900">Geometry</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {GEOMETRY_OPTIONS.map((geometry) => {
              const checked = draft.geometry.includes(geometry)
              return (
                <label
                  key={geometry}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                    checked
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        geometry: checked
                          ? prev.geometry.filter((g) => g !== geometry)
                          : [...prev.geometry, geometry],
                      }))
                    }
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-mono">{geometry}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900">Options</label>
          <textarea
            value={draft.optionsText}
            onChange={(event) => setDraft((prev) => ({ ...prev, optionsText: event.target.value }))}
            rows={4}
            placeholder="yes&#10;no&#10;limited"
            className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-slate-500">
            One per line — for combo, radio, and similar types.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-900">prerequisiteTag key</label>
            <Input
              value={draft.prerequisiteKey}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, prerequisiteKey: event.target.value }))
              }
              placeholder="amenity"
              className="mt-1.5 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">
              prerequisiteTag values
            </label>
            <textarea
              value={draft.prerequisiteValuesText}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, prerequisiteValuesText: event.target.value }))
              }
              rows={3}
              placeholder="toilets&#10;shower"
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.addToFields}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, addToFields: event.target.checked }))
            }
            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          Add to preset fields list after saving
        </label>

        {preview ? (
          <div>
            <h3 className="text-sm font-medium text-slate-900">Preview</h3>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">
              {formatFieldJson(preview)}
            </pre>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Save field draft
          </button>
        </div>
      </CatalystDialogBody>
    </CatalystDialog>
  )
}
