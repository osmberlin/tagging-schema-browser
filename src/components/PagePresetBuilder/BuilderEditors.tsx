import { useEffect, useRef, useState } from 'react'

type TagRow = {
  id: number
  key: string
  value: string
}

type TagKeyValueEditorProps = {
  /** Changes when the committed URL snapshot for these tags changes. */
  syncToken: string
  committedTags: Record<string, string>
  onDraftChange: (tags: Record<string, string>) => void
  onCommit?: () => void
  onEditStart?: () => void
}

function rowsFromTags(tags: Record<string, string>): TagRow[] {
  const entries = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) {
    return [{ id: 0, key: '', value: '' }]
  }
  return entries.map(([key, value], index) => ({ id: index, key, value }))
}

function nextRowId(rows: TagRow[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), -1) + 1
}

function rowsToTags(rows: TagRow[]): Record<string, string> {
  const next: Record<string, string> = {}
  for (const row of rows) {
    const trimmedKey = row.key.trim()
    if (trimmedKey) next[trimmedKey] = row.value
  }
  return next
}

export function TagKeyValueEditor({
  syncToken,
  committedTags,
  onDraftChange,
  onCommit,
  onEditStart,
}: TagKeyValueEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSyncTokenRef = useRef(syncToken)
  const [rows, setRows] = useState<TagRow[]>(() => rowsFromTags(committedTags))

  // Re-hydrate local rows when the URL commits a new tag snapshot.
  useEffect(() => {
    if (lastSyncTokenRef.current === syncToken) return
    lastSyncTokenRef.current = syncToken
    setRows(rowsFromTags(committedTags))
  }, [syncToken, committedTags])

  const updateRow = (rowId: number, patch: Partial<Pick<TagRow, 'key' | 'value'>>) => {
    onEditStart?.()
    setRows((prev) => {
      const nextRows = prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
      onDraftChange(rowsToTags(nextRows))
      return nextRows
    })
  }

  const addRow = () => {
    onEditStart?.()
    setRows((prev) => {
      const nextRows = [...prev, { id: nextRowId(prev), key: '', value: '' }]
      onDraftChange(rowsToTags(nextRows))
      return nextRows
    })
  }

  const removeRow = (rowId: number) => {
    onEditStart?.()
    setRows((prev) => {
      const nextRows = prev.filter((row) => row.id !== rowId)
      const resolved = nextRows.length > 0 ? nextRows : [{ id: 0, key: '', value: '' }]
      onDraftChange(rowsToTags(resolved))
      return resolved
    })
  }

  const handleContainerBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && containerRef.current?.contains(next)) return
    onCommit?.()
  }

  return (
    <div ref={containerRef} className="space-y-2" onBlur={handleContainerBlur}>
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            type="text"
            value={row.key}
            onFocus={onEditStart}
            onChange={(event) => updateRow(row.id, { key: event.target.value })}
            placeholder="amenity"
            className="w-2/5 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            spellCheck={false}
          />
          <span className="text-slate-400">=</span>
          <input
            type="text"
            value={row.value}
            onFocus={onEditStart}
            onChange={(event) => updateRow(row.id, { value: event.target.value })}
            placeholder="cafe"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            className="rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Remove tag"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm font-medium text-rose-600 hover:text-rose-700"
      >
        + Add tag
      </button>
    </div>
  )
}

type StringListEditorProps = {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  onBlur?: () => void
  onEditStart?: () => void
  placeholder?: string
  hint?: string
}

function parseStringListText(nextText: string): string[] {
  return nextText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function StringListEditor({
  label,
  values,
  onChange,
  onBlur,
  onEditStart,
  placeholder = 'one per line',
  hint,
}: StringListEditorProps) {
  const committedText = values.join('\n')
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? committedText

  const commitDraft = () => {
    const next = parseStringListText(display)
    onChange(next)
    setDraft(null)
    onBlur?.()
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-900">{label}</label>
      <textarea
        value={display}
        onChange={(event) => {
          onEditStart?.()
          setDraft(event.target.value)
        }}
        onFocus={() => {
          onEditStart?.()
          if (draft === null) setDraft(committedText)
        }}
        onBlur={commitDraft}
        rows={4}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
        spellCheck={false}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
