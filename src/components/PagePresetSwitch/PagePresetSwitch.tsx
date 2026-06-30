import { PresetCombobox, SwapPresetsButton } from "@/components/PagePresetSwitch/PresetCombobox";
import { presetSwitchSearchSchema } from "@/components/PagePresetSwitch/presetSwitchSearch";
import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { useSetPreset } from "@/components/PagePresets/useSearchState";
import { AreaIcon } from "@/components/ui/areaIcons";
import { useSchema } from "@/contexts/SchemaContext";
import { areaAccent } from "@/theme/areaAccent";
import { externalLinkClass } from "@/theme/externalAccent";
import {
  type TagRemovalReason,
  type TagSwitchRow,
  effectiveRemoveTagsForPreset,
  hasExplicitRemoveTags,
  simulatePresetTagSwitch,
} from "@/utils/presetTagSwitch";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useCallback, useMemo } from "react";

function removalReasonLabel(reason: TagRemovalReason): string {
  switch (reason) {
    case "removeTags":
      return "removeTags";
    case "fieldKeys":
      return "Field keys";
    case "both":
      return "Both";
  }
}

function ChangeBadge({ change }: { change: TagSwitchRow["change"] }) {
  const styles: Record<TagSwitchRow["change"], string> = {
    added: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    removed: "bg-rose-50 text-rose-700 ring-rose-100",
    changed: "bg-amber-50 text-amber-800 ring-amber-100",
    unchanged: "bg-slate-50 text-slate-500 ring-slate-100",
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset",
        styles[change],
      )}
    >
      {change}
    </span>
  );
}

function TagValue({ value }: { value: string | undefined }) {
  if (value === undefined) return <span className="text-slate-300">—</span>;
  return <code className="font-mono text-xs text-slate-800">{value}</code>;
}

export function PagePresetSwitch() {
  const { presets, rawPresets, fields, loading, error } = useSchema();
  const navigate = useNavigate();
  const search = useSearch({ strict: false, select: (raw) => presetSwitchSearchSchema.parse(raw) });
  const setPreset = useSetPreset();

  const setSearch = useCallback(
    (patch: Partial<typeof search>) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true });
    },
    [navigate],
  );

  const preset1 = search.preset1;
  const preset2 = search.preset2;

  const denorm1 = preset1 ? presets.find((p) => p.id === preset1) : undefined;
  const denorm2 = preset2 ? presets.find((p) => p.id === preset2) : undefined;
  const raw1 = preset1 ? rawPresets[preset1] : undefined;
  const raw2 = preset2 ? rawPresets[preset2] : undefined;

  const result = useMemo(() => {
    if (!preset1 || !preset2) return null;
    return simulatePresetTagSwitch(preset1, preset2, rawPresets, fields);
  }, [preset1, preset2, rawPresets, fields]);

  const changedRows = result?.rows.filter((r) => r.change !== "unchanged") ?? [];
  const removedRows = changedRows.filter((r) => r.change === "removed");
  const addedRows = changedRows.filter((r) => r.change === "added");

  if (loading) {
    return <p className="text-sm text-slate-600">Loading schema…</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Schema failed to load</h1>
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    );
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
          Compare how tags change when switching from one preset to another in iD, assuming the
          feature currently has all tags from preset 1&apos;s{" "}
          <code className="font-mono text-xs">addTags</code> (or{" "}
          <code className="font-mono text-xs">tags</code>). Shows both the explicit{" "}
          <code className="font-mono text-xs">removeTags</code> mechanism and iD&apos;s newer
          field-key cleanup logic.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <PresetCombobox
          label="Preset 1 (current)"
          value={preset1}
          onChange={(id) => setSearch({ preset1: id })}
          presets={presets}
        />
        <SwapPresetsButton onClick={() => setSearch({ preset1: preset2, preset2: preset1 })} />
        <PresetCombobox
          label="Preset 2 (target)"
          value={preset2}
          onChange={(id) => setSearch({ preset2: id })}
          presets={presets}
        />
      </section>

      {preset1 && preset2 && raw1 && raw2 && result ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
            <h2 className="font-display text-sm font-semibold text-slate-900">How removal works</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <strong className="font-medium text-slate-900">removeTags</strong> — keys listed on
                preset 1&apos;s <code className="font-mono text-xs">removeTags</code>
                {hasExplicitRemoveTags(raw1) ? (
                  <> (explicitly defined)</>
                ) : (
                  <>
                    {" "}
                    (defaults to <code className="font-mono text-xs">addTags</code>, then{" "}
                    <code className="font-mono text-xs">tags</code>)
                  </>
                )}
                :{" "}
                <code className="font-mono text-xs">
                  {Object.keys(effectiveRemoveTagsForPreset(raw1)).join(", ") || "—"}
                </code>
              </li>
              <li>
                <strong className="font-medium text-slate-900">Field keys</strong> — iD also removes
                tag keys from preset 1&apos;s fields that are not preserved by preset 2&apos;s
                fields or <code className="font-mono text-xs">addTags</code>.{" "}
                {result.usedFieldKeyRemoval ? (
                  <span className="text-amber-800">Applied for this pair.</span>
                ) : (
                  <span className="text-slate-500">
                    Not applied — preset 1 would still match after the reduced pass.
                  </span>
                )}
              </li>
              <li>
                Preserved keys from preset 2 are not removed even if listed in{" "}
                <code className="font-mono text-xs">removeTags</code>.
              </li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Geometry used for field matching: <code className="font-mono">{result.geometry}</code>
              . Simplified from{" "}
              <a
                href="https://github.com/openstreetmap/iD/blob/develop/modules/actions/change_preset.js"
                target="_blank"
                rel="noopener noreferrer"
                className={externalLinkClass()}
              >
                iD change_preset
              </a>
              . See also{" "}
              <a
                href="https://github.com/ideditor/schema-builder/issues/329"
                target="_blank"
                rel="noopener noreferrer"
                className={externalLinkClass()}
              >
                schema-builder #329
              </a>
              .
            </p>
          </section>

          <section className="flex flex-wrap items-center gap-3 text-sm">
            {denorm1 ? (
              <button
                type="button"
                onClick={() => setPreset(denorm1.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 ring-inset hover:bg-slate-50"
              >
                <PresetIconBox preset={denorm1} size="sm" />
                <span>{denorm1.name}</span>
              </button>
            ) : null}
            <span className="text-slate-400">→</span>
            {denorm2 ? (
              <button
                type="button"
                onClick={() => setPreset(denorm2.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 ring-inset hover:bg-slate-50"
              >
                <PresetIconBox preset={denorm2} size="sm" />
                <span>{denorm2.name}</span>
              </button>
            ) : null}
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              {removedRows.length} removed, {addedRows.length} added
              {changedRows.length - removedRows.length - addedRows.length > 0
                ? `, ${changedRows.length - removedRows.length - addedRows.length} changed`
                : ""}
            </span>
          </section>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Tag</th>
                  <th className="px-4 py-3">Before</th>
                  <th className="px-4 py-3">After</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">Removal reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {changedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No tag changes — starting and ending tag sets are identical.
                    </td>
                  </tr>
                ) : (
                  changedRows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-800">{row.key}</td>
                      <td className="px-4 py-2.5">
                        <TagValue value={row.before} />
                      </td>
                      <td className="px-4 py-2.5">
                        <TagValue value={row.after} />
                      </td>
                      <td className="px-4 py-2.5">
                        <ChangeBadge change={row.change} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {row.removalReason ? (
                          <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 ring-1 ring-amber-100 ring-inset">
                            {removalReasonLabel(row.removalReason)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <details className="rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
              Show all tags (including unchanged)
            </summary>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2">Tag</th>
                    <th className="px-4 py-2">Before</th>
                    <th className="px-4 py-2">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.rows.map((row) => (
                    <tr
                      key={row.key}
                      className={row.change === "unchanged" ? "text-slate-500" : ""}
                    >
                      <td className="px-4 py-2 font-mono text-xs">{row.key}</td>
                      <td className="px-4 py-2">
                        <TagValue value={row.before} />
                      </td>
                      <td className="px-4 py-2">
                        <TagValue value={row.after} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : preset1 || preset2 ? (
        <p className="text-sm text-slate-500">Select both presets to see the tag diff.</p>
      ) : (
        <p className="text-sm text-slate-500">
          Pick two presets above. You can also open this page from a preset detail page with preset
          1 pre-filled.
        </p>
      )}
    </div>
  );
}
