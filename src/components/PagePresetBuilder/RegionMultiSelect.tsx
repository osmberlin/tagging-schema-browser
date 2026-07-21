import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { useMemo, useState } from 'react'
import {
  filterRegionOptions,
  regionLabel,
  type RegionOption,
} from '@/components/PagePresetBuilder/regionOptions'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'

type RegionMultiSelectProps = {
  label: string
  selected: string[]
  onChange: (ids: string[]) => void
}

export function RegionMultiSelect({ label, selected, onChange }: RegionMultiSelectProps) {
  const [query, setQuery] = useState('')
  const options = useMemo(() => filterRegionOptions(query), [query])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const addRegion = (option: RegionOption | null) => {
    if (!option || selectedSet.has(option.id)) return
    onChange([...selected, option.id])
    setQuery('')
  }

  const removeRegion = (id: string) => {
    onChange(selected.filter((item) => item !== id))
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-900">{label}</span>
      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => removeRegion(id)}
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 ring-1 ring-rose-100 ring-inset hover:bg-rose-100"
              >
                {regionLabel(id)}
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No regions selected.</p>
      )}

      <Combobox value={null} onChange={addRegion} onClose={() => setQuery('')}>
        <div className="relative">
          <ComboboxInput
            className={cn(
              'block w-full rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-3 text-sm text-slate-900 shadow-sm',
              areaAccent.presets.focus,
            )}
            placeholder="Search regions by name or code…"
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
            <span className="text-xs">Add</span>
          </ComboboxButton>
          <ComboboxOptions className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {options.map((option) => (
              <ComboboxOption
                key={option.id}
                value={option}
                disabled={selectedSet.has(option.id)}
                className="cursor-pointer px-3 py-2 text-sm text-slate-900 data-disabled:opacity-40 data-focus:bg-rose-50"
              >
                <span className="mr-1.5">{option.emojiFlag}</span>
                {option.nameEn}
                <span className="ml-2 font-mono text-xs text-slate-500">{option.id}</span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  )
}
