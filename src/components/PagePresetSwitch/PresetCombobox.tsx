import { Combobox, ComboboxButton, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useState } from 'react'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { Input } from '@/components/ui/Input'
import { areaAccent } from '@/theme/areaAccent'
import { presetMatchesTextQuery } from '@/utils/presetTextMatch'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset } from '@/utils/types'

const MAX_RESULTS = 40
const SEARCH_PLACEHOLDER = 'Search presets by name, path (amenity/cafe), tags…'

function SearchIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
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
  onOpenPreset?: (id: string) => void
}

/** Remount when `value` changes so dropdown search resets (swap, URL load). */
export function PresetCombobox(props: PresetComboboxProps) {
  return <PresetComboboxInner key={props.value} {...props} />
}

const TRIGGER_MIN_H = 'min-h-[52px]'

function PresetComboboxInner({
  label,
  value,
  onChange,
  presets,
  onOpenPreset,
}: PresetComboboxProps) {
  const selected = value ? presets.find((p) => p.id === value) : undefined
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = (
    searchQuery.trim()
      ? presets.filter((preset) => presetMatchesTextQuery(preset, searchQuery))
      : presets
  ).slice(0, MAX_RESULTS)

  return (
    <Combobox
      value={selected ?? null}
      onChange={(preset: DenormalizedPreset | null) => {
        onChange(preset?.id ?? '')
        setSearchQuery('')
      }}
      onClose={() => setSearchQuery('')}
    >
      <div className="block text-sm font-medium text-slate-700">
        <span>{label}</span>
        <ComboboxButton
          className={cn(
            'relative mt-1.5 flex w-full cursor-pointer items-center rounded-lg border border-slate-300 bg-white text-left shadow-sm',
            TRIGGER_MIN_H,
            areaAccent.presetSwitch.focus,
          )}
        >
          {selected ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-10 pl-2">
              <PresetOptionContent preset={selected} onOpenPreset={onOpenPreset} idInteractive />
            </div>
          ) : (
            <span className="px-3 text-sm text-slate-400">Select a preset…</span>
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </ComboboxButton>

        {!selected && value ? (
          <p className="mt-1 font-mono text-[11px] text-amber-700">Unknown preset: {value}</p>
        ) : null}
      </div>

      <ComboboxOptions
        anchor="bottom start"
        className={cn(
          'z-50 mt-1 max-h-80 w-[var(--button-width)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg',
          'empty:invisible',
        )}
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              autoFocus
              type="search"
              area="presetSwitch"
              value={searchQuery}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(event.target.value)
              }
              onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => event.stopPropagation()}
              placeholder={SEARCH_PLACEHOLDER}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
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
        </div>
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
        'flex h-[52px] w-10 shrink-0 items-center justify-center self-end rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition',
        'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
        areaAccent.presetSwitch.focus,
      )}
      title="Swap current and target presets"
      aria-label="Swap current and target presets"
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
