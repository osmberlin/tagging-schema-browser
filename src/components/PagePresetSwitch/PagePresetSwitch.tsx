import { useState } from 'react'
import { PresetIconBox } from '@/components/PagePresets/PresetIconBox'
import { useSetPreset } from '@/components/PagePresets/useSearchState'
import { PresetCombobox, SwapPresetsButton } from '@/components/PagePresetSwitch/PresetCombobox'
import { usePresetSwitchSearch } from '@/components/PagePresetSwitch/usePresetSwitchSearch'
import { AreaIcon } from '@/components/ui/areaIcons'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { externalLinkClass } from '@/theme/externalAccent'
import {
  TAG_SWITCH_ACTION,
  type TagSwitchAction,
  type TagSwitchRow,
  simulatePresetTagSwitch,
} from '@/utils/presetTagSwitch'
import { cn } from '@/utils/tw'

const ACTION_STYLES: Record<TagSwitchAction, string> = {
  unchanged: 'bg-slate-50 text-slate-500 ring-slate-100',
  changed: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  'removed-field': 'bg-amber-50 text-amber-900 ring-amber-100',
  'removed-explicit': 'bg-rose-50 text-rose-800 ring-rose-100',
}

function ActionBadge({ action }: { action: TagSwitchAction }) {
  const { label, title } = TAG_SWITCH_ACTION[action]
  return (
    <span
      title={title}
      className={cn(
        'inline-block cursor-help rounded px-2 py-0.5 text-[11px] leading-snug font-medium ring-1 ring-inset',
        ACTION_STYLES[action],
      )}
    >
      {label}
    </span>
  )
}

function TagValue({ value }: { value: string | undefined }) {
  if (value === undefined) return <span className="text-slate-300">—</span>
  return <code className="font-mono text-xs text-slate-800">{value}</code>
}

function TagSwitchTable({ rows, changesOnly }: { rows: TagSwitchRow[]; changesOnly: boolean }) {
  const visible = changesOnly ? rows.filter((row) => row.action !== 'unchanged') : rows

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3">Tag</th>
            <th className="px-4 py-3">Before</th>
            <th className="px-4 py-3">After</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visible.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                No tag changes for this pair.
              </td>
            </tr>
          ) : (
            visible.map((row) => (
              <tr
                key={row.key}
                className={row.action === 'unchanged' ? 'text-slate-500' : 'hover:bg-slate-50/80'}
              >
                <td className="px-4 py-2.5 font-mono text-xs">{row.key}</td>
                <td className="px-4 py-2.5">
                  <TagValue value={row.before} />
                </td>
                <td className="px-4 py-2.5">
                  <TagValue value={row.after} />
                </td>
                <td className="px-4 py-2.5">
                  <ActionBadge action={row.action} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PagePresetSwitch() {
  const { presets, rawPresets, fields, loading, error } = useSchema()
  const [search, setSearch] = usePresetSwitchSearch()
  const setPreset = useSetPreset()
  const [changesOnly, setChangesOnly] = useState(false)

  const { preset1, preset2 } = search

  const denorm1 = preset1 ? presets.find((p) => p.id === preset1) : undefined
  const denorm2 = preset2 ? presets.find((p) => p.id === preset2) : undefined

  const result =
    preset1 && preset2 ? simulatePresetTagSwitch(preset1, preset2, rawPresets, fields) : null

  const changedCount = result?.rows.filter((row) => row.action !== 'unchanged').length ?? 0

  if (loading) {
    return <p className="text-sm text-slate-600">Loading schema…</p>
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Schema failed to load</h1>
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2">
          <span className={`rounded-lg p-2 ${areaAccent.presetSwitch.iconBg}`}>
            <AreaIcon area="presetSwitch" className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-slate-950">Preset tag switch</h1>
        </div>
        <p className="max-w-3xl text-sm text-slate-600">
          Simulates iD switching from preset 1 to preset 2. Starting tags = preset 1{' '}
          <code className="font-mono text-xs">addTags</code>/
          <code className="font-mono text-xs">tags</code> plus every field key on preset 1 filled
          with a placeholder value. Based on{' '}
          <a
            href="https://github.com/openstreetmap/iD/blob/develop/modules/actions/change_preset.js"
            target="_blank"
            rel="noopener noreferrer"
            className={externalLinkClass()}
          >
            iD change_preset
          </a>
          .
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <PresetCombobox
          label="Preset 1 (current)"
          value={preset1}
          onChange={(id) => setSearch({ preset1: id })}
          presets={presets}
          onOpenPreset={setPreset}
        />
        <SwapPresetsButton onClick={() => setSearch({ preset1: preset2, preset2: preset1 })} />
        <PresetCombobox
          label="Preset 2 (target)"
          value={preset2}
          onChange={(id) => setSearch({ preset2: id })}
          presets={presets}
          onOpenPreset={setPreset}
        />
      </section>

      {preset1 && preset2 && denorm1 && denorm2 && result ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <PresetIconBox preset={denorm1} size="sm" />
                {denorm1.name}
              </span>
              <span className="mx-2 text-slate-400">→</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <PresetIconBox preset={denorm2} size="sm" />
                {denorm2.name}
              </span>
              <span className="mx-2 text-slate-300">·</span>
              {result.fieldCount} fields · {result.rows.length} tags · {changedCount} changed
              <span className="mx-2 text-slate-300">·</span>
              geometry <code className="font-mono text-xs">{result.geometry}</code>
              {result.usedFieldKeyRemoval ? (
                <span className="ml-2 text-amber-700">(field-key cleanup applied)</span>
              ) : null}
            </p>
            <label className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={changesOnly}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setChangesOnly(event.target.checked)
                }
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500/40"
              />
              Changes only
            </label>
          </div>

          <TagSwitchTable rows={result.rows} changesOnly={changesOnly} />
        </>
      ) : preset1 || preset2 ? (
        <p className="text-sm text-slate-500">Select both presets to see the tag diff.</p>
      ) : (
        <p className="text-sm text-slate-500">
          Pick two presets above, or open from a preset detail page with preset 1 pre-filled.
        </p>
      )}
    </div>
  )
}
