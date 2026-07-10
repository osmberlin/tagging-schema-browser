import { useCallback, useState } from 'react'

type TagKeyValueEditorProps = {
  tags: Record<string, string>
  onChange: (tags: Record<string, string>) => void
}

export function TagKeyValueEditor({ tags, onChange }: TagKeyValueEditorProps) {
  const entries = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b))
  const rows = entries.length > 0 ? entries : [['', ''] as const]

  const updateRow = (index: number, key: string, value: string) => {
    const nextEntries = rows.map((row, rowIndex) =>
      rowIndex === index ? ([key, value] as const) : row,
    )
    const next: Record<string, string> = {}
    for (const [k, v] of nextEntries) {
      if (k.trim()) next[k.trim()] = v.trim()
    }
    onChange(next)
  }

  const addRow = () => {
    const next = { ...tags }
    let index = 1
    while (`new_key_${index}` in next) index += 1
    next[`new_key_${index}`] = ''
    onChange(next)
  }

  const removeRow = (index: number) => {
    const nextEntries = rows.filter((_, rowIndex) => rowIndex !== index)
    const next: Record<string, string> = {}
    for (const [k, v] of nextEntries) {
      if (k.trim()) next[k.trim()] = v.trim()
    }
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {rows.map(([key, value], index) => (
        <div key={`${index}-${key}`} className="flex items-center gap-2">
          <input
            type="text"
            value={key}
            onChange={(event) => updateRow(index, event.target.value, value)}
            placeholder="amenity"
            className="w-2/5 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            spellCheck={false}
          />
          <span className="text-slate-400">=</span>
          <input
            type="text"
            value={value}
            onChange={(event) => updateRow(index, key, event.target.value)}
            placeholder="cafe"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
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
  placeholder?: string
  hint?: string
}

export function StringListEditor({
  label,
  values,
  onChange,
  placeholder = 'one per line',
  hint,
}: StringListEditorProps) {
  const text = values.join('\n')

  const commit = (nextText: string) => {
    const next = nextText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-900">{label}</label>
      <textarea
        value={text}
        onChange={(event) => commit(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
        spellCheck={false}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

export function ShareLinkButton() {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [])

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
    >
      {copied ? 'Link copied' : 'Copy share link'}
    </button>
  )
}
