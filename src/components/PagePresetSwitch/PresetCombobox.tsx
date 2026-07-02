import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { useState } from 'react'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { Input } from '@/components/ui/Input'
import { areaAccent } from '@/theme/areaAccent'
import { schemaRepoPath } from '@/utils/githubFileUrl'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset } from '@/utils/types'

const MAX_RESULTS = 40

function matchesQuery(preset: DenormalizedPreset, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const path = schemaRepoPath('preset', preset.id).toLowerCase()
  return (
    preset.name.toLowerCase().includes(q) || preset.id.toLowerCase().includes(q) || path.includes(q)
  )
}

function PresetOptionContent({
  preset,
  onOpenPreset,
  idInteractive = false,
}: {
  preset: DenormalizedPreset
  onOpenPreset?: (id: string) => void
  idInteractive?: boolean
}) {
  return (
    <>
      <PresetIconBox preset={preset} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-900">{preset.name}</span>
        {onOpenPreset ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onOpenPreset(preset.id)
            }}
            className={cn(
              'block max-w-full truncate text-left font-mono text-[10px] text-slate-500',
              idInteractive
                ? 'pointer-events-auto hover:text-amber-700 hover:underline'
                : 'group-data-focus:text-amber-700',
            )}
            title="Open preset details"
          >
            {preset.id}
          </button>
        ) : (
          <span className="block truncate font-mono text-[10px] text-slate-500">{preset.id}</span>
        )}
      </span>
    </>
  )
}

type PresetComboboxProps = {
  label: string
  value: string
  onChange: (id: string) => void
  presets: DenormalizedPreset[]
  placeholder?: string
  onOpenPreset?: (id: string) => void
}

/** Remount when `value` changes so the search field resets (swap, URL load). */
export function PresetCombobox(props: PresetComboboxProps) {
  return <PresetComboboxInner key={props.value} {...props} />
}

function PresetComboboxInner({
  label,
  value,
  onChange,
  presets,
  placeholder = 'Search preset name or path…',
  onOpenPreset,
}: PresetComboboxProps) {
  const selected = value ? presets.find((p) => p.id === value) : undefined
  const [query, setQuery] = useState(selected?.name ?? '')
  const [isSearching, setIsSearching] = useState(false)

  const list = query.trim() ? presets.filter((p) => matchesQuery(p, query)) : presets
  const filtered = list.slice(0, MAX_RESULTS)
  const showSelectedDisplay = Boolean(selected && !isSearching)

  return (
    <Combobox
      value={selected ?? null}
      onChange={(preset: DenormalizedPreset | null) => {
        onChange(preset?.id ?? '')
        setQuery(preset?.name ?? '')
        setIsSearching(false)
      }}
      onClose={() => {
        setIsSearching(false)
        if (selected) setQuery(selected.name)
      }}
    >
      <div className="block text-sm font-medium text-slate-700">
        <span>{label}</span>
        <div
          className={cn(
            'relative mt-1.5 flex min-h-11 items-center rounded-lg border border-slate-300 bg-white shadow-sm',
            areaAccent.presetSwitch.focus.replaceAll('focus:', 'focus-within:'),
          )}
        >
          {showSelectedDisplay ? (
            <div
              className="pointer-events-none flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-10 pl-2"
              aria-hidden
            >
              <PresetOptionContent preset={selected!} onOpenPreset={onOpenPreset} idInteractive />
            </div>
          ) : selected ? (
            <div className="ml-2 shrink-0">
              <PresetIconBox preset={selected} size="sm" />
            </div>
          ) : null}

          <ComboboxInput
            as={Input}
            area="presetSwitch"
            displayValue={() => query}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
              setIsSearching(true)
              if (selected) event.target.select()
            }}
            placeholder={placeholder}
            className={cn(
              'border-0 bg-transparent shadow-none focus:ring-0',
              showSelectedDisplay
                ? 'absolute inset-0 opacity-0'
                : cn('min-w-0 flex-1 py-2', selected ? 'pr-10 pl-2' : 'pr-10'),
            )}
            autoComplete="off"
          />

          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </ComboboxButton>
        </div>

        {!selected && value ? (
          <p className="mt-1 font-mono text-[11px] text-amber-700">Unknown preset: {value}</p>
        ) : null}
      </div>

      <ComboboxOptions
        anchor="bottom start"
        className={cn(
          'z-50 mt-1 max-h-72 w-[var(--input-width)] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg',
          'empty:invisible',
        )}
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-slate-500">No presets match.</p>
        ) : (
          filtered.map((preset) => (
            <ComboboxOption
              key={preset.id}
              value={preset}
              className="group flex cursor-pointer items-center gap-2 px-2 py-1.5 data-focus:bg-amber-50"
            >
              <PresetOptionContent preset={preset} onOpenPreset={onOpenPreset} />
            </ComboboxOption>
          ))
        )}
        {filtered.length === MAX_RESULTS ? (
          <p className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400">
            Showing first {MAX_RESULTS} matches — refine your search.
          </p>
        ) : null}
      </ComboboxOptions>
    </Combobox>
  )
}

export function SwapPresetsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-11 w-10 shrink-0 items-center justify-center self-end rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition',
        'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
        areaAccent.presetSwitch.focus,
      )}
      title="Swap preset 1 and preset 2"
      aria-label="Swap preset 1 and preset 2"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M7 7h11M7 7l3-3M7 7l3 3M17 17H6M17 17l-3 3M17 17l-3-3"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
