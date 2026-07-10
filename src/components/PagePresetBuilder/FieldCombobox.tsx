import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { useMemo, useState } from 'react'
import { areaAccent } from '@/theme/areaAccent'
import { fieldTypeHint } from '@/utils/fieldTypes'
import { cn } from '@/utils/tw'
import type { FieldViewModel } from '@/utils/types'

const MAX_RESULTS = 40

function fieldMatchesQuery(field: FieldViewModel, query: string): boolean {
  const haystack = [field.id, field.label, field.key, field.type].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

type FieldComboboxProps = {
  fields: FieldViewModel[]
  exclude: Set<string>
  onSelect: (fieldId: string) => void
  placeholder?: string
}

export function FieldCombobox({
  fields,
  exclude,
  onSelect,
  placeholder = 'Search fields by id, label, or type…',
}: FieldComboboxProps) {
  const [query, setQuery] = useState('')

  const options = useMemo(() => {
    const trimmed = query.trim()
    const filtered = trimmed ? fields.filter((field) => fieldMatchesQuery(field, trimmed)) : fields
    return filtered.filter((field) => !exclude.has(field.id)).slice(0, MAX_RESULTS)
  }, [fields, exclude, query])

  return (
    <Combobox
      value={null}
      onChange={(field: FieldViewModel | null) => {
        if (!field) return
        onSelect(field.id)
        setQuery('')
      }}
      onClose={() => setQuery('')}
    >
      <div className="relative">
        <ComboboxInput
          className={cn(
            'block w-full rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-3 text-sm text-slate-900 shadow-sm',
            areaAccent.presets.focus,
          )}
          placeholder={placeholder}
          displayValue={() => query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
          <span className="text-xs">Add</span>
        </ComboboxButton>
        <ComboboxOptions className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg empty:invisible">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">No fields match.</p>
          ) : (
            options.map((field) => (
              <ComboboxOption
                key={field.id}
                value={field}
                className="cursor-pointer px-3 py-2 data-focus:bg-rose-50"
              >
                <span className="block truncate text-sm font-medium text-slate-900">
                  {field.label}
                </span>
                <span className="block truncate font-mono text-[11px] text-slate-500">
                  {field.id}
                </span>
                <span className="text-[10px] text-slate-400" title={fieldTypeHint(field.type)}>
                  {field.type}
                  {field.usageCount > 0
                    ? ` · ${field.usageCount} preset${field.usageCount === 1 ? '' : 's'}`
                    : ''}
                </span>
              </ComboboxOption>
            ))
          )}
          {options.length === MAX_RESULTS ? (
            <p className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400">
              Showing first {MAX_RESULTS} matches — refine your search.
            </p>
          ) : null}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}
