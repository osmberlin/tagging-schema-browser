import { Reorder, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import {
  buildFieldPageUrl,
  buildPresetsFieldFilterUrl,
} from '@/components/PagePresetBuilder/builderPageUrls'
import { FieldCombobox } from '@/components/PagePresetBuilder/FieldCombobox'
import { isPresetRef } from '@/components/PagePresetBuilder/presetBuilderUtils'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import type { FieldViewModel } from '@/utils/types'

type FieldListKind = 'primary' | 'more'

type FieldListEditorProps = {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  onEditStart?: () => void
  listKind: FieldListKind
  fieldCatalog: FieldViewModel[]
  draftFieldIds: Set<string>
  dataUrl: string
  parentPresetRef?: string | null
  onCreateField: () => void
  hint?: string
}

function fieldLabelForId(
  fieldId: string,
  catalog: Map<string, FieldViewModel>,
  draftFieldIds: Set<string>,
): string {
  if (isPresetRef(fieldId)) return `Preset fields ${fieldId}`
  const known = catalog.get(fieldId)
  if (known) return known.label
  if (draftFieldIds.has(fieldId)) return `${fieldId} (draft)`
  return fieldId
}

function DragHandle() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
      aria-hidden
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M7 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM7 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM7 16a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM13 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM13 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM13 16a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    </span>
  )
}

function FieldListRow({
  fieldId,
  label,
  dataUrl,
  listKind,
  isDraft,
  isPresetReference,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  reducedMotion,
}: {
  fieldId: string
  label: string
  dataUrl: string
  listKind: FieldListKind
  isDraft: boolean
  isPresetReference: boolean
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  reducedMotion: boolean
}) {
  const showFieldLinks = !isPresetReference
  const fieldPageUrl = showFieldLinks ? buildFieldPageUrl(fieldId, dataUrl) : null
  const presetsUrl = showFieldLinks ? buildPresetsFieldFilterUrl(fieldId, dataUrl, listKind) : null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-xs',
        isDraft && 'border-amber-200 bg-amber-50/40',
      )}
    >
      {reducedMotion ? (
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="rounded px-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="rounded px-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
        </div>
      ) : (
        <DragHandle />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{label}</p>
        <p className="truncate font-mono text-[11px] text-slate-500">{fieldId}</p>
      </div>
      {showFieldLinks ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
          {fieldPageUrl ? (
            <a
              href={fieldPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-rose-600 hover:text-rose-700"
            >
              Field ↗
            </a>
          ) : null}
          {presetsUrl ? (
            <a
              href={presetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-rose-600 hover:text-rose-700"
            >
              Presets ↗
            </a>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Remove ${fieldId}`}
      >
        ×
      </button>
    </div>
  )
}

export function FieldListEditor({
  label,
  values,
  onChange,
  onEditStart,
  listKind,
  fieldCatalog,
  draftFieldIds,
  dataUrl,
  parentPresetRef,
  onCreateField,
  hint,
}: FieldListEditorProps) {
  const reducedMotion = useReducedMotion()
  const catalogMap = useMemo(
    () => new Map(fieldCatalog.map((field) => [field.id, field])),
    [fieldCatalog],
  )
  const exclude = useMemo(() => new Set(values), [values])

  const addField = (fieldId: string) => {
    if (!fieldId.trim() || exclude.has(fieldId)) return
    onEditStart?.()
    onChange([...values, fieldId])
  }

  const removeAt = (index: number) => {
    onEditStart?.()
    onChange(values.filter((_, i) => i !== index))
  }

  const moveItem = (from: number, to: number) => {
    if (from === to || to < 0 || to >= values.length) return
    onEditStart?.()
    const next = [...values]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const addParentRef = () => {
    if (!parentPresetRef || exclude.has(parentPresetRef)) return
    addField(parentPresetRef)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <button
          type="button"
          onClick={onCreateField}
          className={cn('text-sm font-medium', areaAccent.presets.link)}
        >
          + Create new field
        </button>
      </div>

      {values.length === 0 ? (
        <p className="text-sm text-slate-500">
          No fields yet — add from the schema or create a new one.
        </p>
      ) : reducedMotion ? (
        <ul className="space-y-2">
          {values.map((fieldId, index) => (
            <li key={`${fieldId}-${index}`}>
              <FieldListRow
                fieldId={fieldId}
                label={fieldLabelForId(fieldId, catalogMap, draftFieldIds)}
                dataUrl={dataUrl}
                listKind={listKind}
                isDraft={draftFieldIds.has(fieldId)}
                isPresetReference={isPresetRef(fieldId)}
                onRemove={() => removeAt(index)}
                onMoveUp={() => moveItem(index, index - 1)}
                onMoveDown={() => moveItem(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < values.length - 1}
                reducedMotion
              />
            </li>
          ))}
        </ul>
      ) : (
        <Reorder.Group
          axis="y"
          values={values}
          onReorder={(next) => {
            onEditStart?.()
            onChange(next)
          }}
          className="space-y-2"
        >
          {values.map((fieldId, index) => (
            <Reorder.Item
              key={fieldId}
              value={fieldId}
              className="list-none"
              whileDrag={{ scale: 1.01, boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}
            >
              <FieldListRow
                fieldId={fieldId}
                label={fieldLabelForId(fieldId, catalogMap, draftFieldIds)}
                dataUrl={dataUrl}
                listKind={listKind}
                isDraft={draftFieldIds.has(fieldId)}
                isPresetReference={isPresetRef(fieldId)}
                onRemove={() => removeAt(index)}
                onMoveUp={() => moveItem(index, index - 1)}
                onMoveDown={() => moveItem(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < values.length - 1}
                reducedMotion={false}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <FieldCombobox fields={fieldCatalog} exclude={exclude} onSelect={addField} />

      {parentPresetRef && !exclude.has(parentPresetRef) ? (
        <button
          type="button"
          onClick={addParentRef}
          className="text-sm font-medium text-rose-600 hover:text-rose-700"
        >
          Add parent field list {parentPresetRef}
        </button>
      ) : null}

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
