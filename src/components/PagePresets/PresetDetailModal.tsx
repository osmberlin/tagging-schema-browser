import { getIconSvgDataUrl } from "@/components/PageIcons/iconRegistry";
import type { PresetFilterUpdate } from "@/components/PagePresets/PresetDetailModal.types";
import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { Badge } from "@/components/ui/Badge";
import { CountPill } from "@/components/ui/CountPill";
import { CatalystDialog, CatalystDialogBody, CatalystDialogTitle } from "@/components/ui/Dialog";
import { useComparison } from "@/contexts/ComparisonContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useSchema } from "@/contexts/SchemaContext";
import { useUiStore } from "@/stores/uiStore";
import { getPresetOptionRows } from "@/utils/fieldOptions";
import type { DenormalizedPreset } from "@/utils/types";
import { clsx } from "clsx";

type RelatedItem = { id: string; name: string };

export function PresetDetailModal({
  presetId,
  open,
  onClose,
  onApplyFilter,
  onOpenPreset,
}: {
  presetId: string | null;
  open: boolean;
  onClose: () => void;
  onApplyFilter: (update: PresetFilterUpdate) => void;
  onOpenPreset: (id: string) => void;
}) {
  const { presetsById, presets } = useSchema();
  const preset = presetId ? presetsById.get(presetId) : undefined;

  return (
    <CatalystDialog open={open} onClose={onClose} size="4xl">
      {!preset ? (
        <>
          <CatalystDialogTitle>Preset not found</CatalystDialogTitle>
          <CatalystDialogBody>
            <p className="text-sm text-slate-600">
              No preset matches this link for the loaded schema.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
            >
              Close
            </button>
          </CatalystDialogBody>
        </>
      ) : (
        <PresetDetailContent
          preset={preset}
          presets={presets}
          onClose={onClose}
          onApplyFilter={onApplyFilter}
          onOpenPreset={onOpenPreset}
        />
      )}
    </CatalystDialog>
  );
}

function PresetDetailContent({
  preset,
  presets,
  onClose,
  onApplyFilter,
  onOpenPreset,
}: {
  preset: DenormalizedPreset;
  presets: DenormalizedPreset[];
  onClose: () => void;
  onApplyFilter: (update: PresetFilterUpdate) => void;
  onOpenPreset: (id: string) => void;
}) {
  const { locale, localeMap, fieldLocaleMap } = useLocale();
  const loc = locale ? localeMap?.get(preset.id) : undefined;
  const { fields, fieldTranslations } = useSchema();
  const optionRows = getPresetOptionRows(preset, fields, fieldTranslations, presets);

  const { result: comparison } = useComparison();
  const changeStatus = comparison?.statusById.get(preset.id);
  const modified = comparison?.modified.find((m) => m.current.id === preset.id);

  const allFields = Array.from(
    new Set([...(preset.fields ?? []), ...(preset.moreFields ?? [])]),
  ).sort((a, b) => a.localeCompare(b));
  const tagEntries = Object.entries(preset.tags ?? {});

  // How many presets share each field — used for the Fields count pills.
  const fieldCounts = new Map<string, number>();
  for (const p of presets) {
    for (const f of new Set([...p.fields, ...p.moreFields])) {
      fieldCounts.set(f, (fieldCounts.get(f) ?? 0) + 1);
    }
  }
  const toItem = (c: DenormalizedPreset): RelatedItem => ({ id: c.id, name: c.name });

  const categorySections = preset.categoryNames.map((categoryName, index) => {
    const categoryId = preset.categoryIds[index];
    const related = presets
      .filter((c) => c.id !== preset.id && c.categoryIds.includes(categoryId))
      .map(toItem);
    return {
      title: `Presets of this category "${categoryName}"`,
      onListClick: () => onApplyFilter({ categoryNames: [categoryName] }),
      related,
    };
  });

  const uncategorizedRelated =
    preset.categoryNames.length === 0
      ? presets.filter((c) => c.id !== preset.id && c.categoryNames.length === 0).map(toItem)
      : [];

  const iconId = preset.icon;
  const iconRelated = iconId
    ? presets.filter((c) => c.id !== preset.id && c.icon === iconId).map(toItem)
    : [];

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <CatalystDialogTitle className="sr-only">{preset.name}</CatalystDialogTitle>
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
          <PresetIconBox preset={preset} size="md" />
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-slate-950">{preset.name}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{preset.id}</p>
            <p className="mt-2 text-sm text-slate-600">
              {preset.aliases.length > 0 ? `Aliases: ${preset.aliases.join(", ")}` : "No aliases"}
            </p>
            {preset.imageURL ? (
              <p className="mt-2 text-sm">
                <span className="text-slate-500">imageURL: </span>
                <a
                  href={preset.imageURL}
                  className="break-all text-sky-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {preset.imageURL}
                </a>
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <CatalystDialogBody className="max-h-[70vh] overflow-y-auto">
        <div className="flex flex-wrap gap-1">
          {tagEntries.map(([k, v]) => (
            <Badge key={k} variant="zinc" className="font-mono">
              {k}={v}
            </Badge>
          ))}
        </div>

        {changeStatus === "added" || changeStatus === "modified" ? (
          <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-800">
              <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden />
              {changeStatus === "added" ? "Added vs release" : "Changes vs release"}
            </h2>
            {changeStatus === "added" ? (
              <p className="text-sm text-violet-700">This preset does not exist in the release.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {modified?.diffs.map((d) => (
                  <li key={d.label} className="grid grid-cols-[5rem_1fr] gap-x-3">
                    <span className="font-semibold tracking-wide text-violet-500 uppercase">
                      {d.label}
                    </span>
                    <span className="min-w-0">
                      <span className="text-rose-600 line-through">{d.before || "—"}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="text-emerald-700">{d.after || "—"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {locale ? (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Translation{" "}
              <span className="font-normal text-slate-400">
                EN ↔ <span className="font-mono">{locale}</span>
              </span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <TranslationRow
                label="Name"
                en={preset.name}
                localized={loc?.name}
                same={Boolean(loc?.name && loc.name === preset.name)}
              />
              <TranslationRow
                label="Terms"
                en={preset.terms.join(", ")}
                localized={loc?.terms.join(", ")}
              />
              <TranslationRow
                label="Aliases"
                en={preset.aliases.join(", ")}
                localized={loc?.aliases.join(", ")}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Fields</h2>
          <div className="flex flex-wrap gap-1.5">
            {allFields.map((fieldId) => (
              <button
                key={fieldId}
                type="button"
                onClick={() => onApplyFilter({ fieldIds: [fieldId] })}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-1.5 pl-3 text-xs font-medium text-slate-700 hover:bg-slate-200"
                title={`${fieldCounts.get(fieldId) ?? 0} presets use this field`}
              >
                <span>{fieldId}</span>
                <CountPill className="bg-white">{fieldCounts.get(fieldId) ?? 0}</CountPill>
              </button>
            ))}
          </div>
        </div>

        {optionRows.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Options
              {locale ? (
                <span className="font-normal text-slate-400">
                  {" "}
                  EN ↔ <span className="font-mono">{locale}</span>
                </span>
              ) : null}
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              {optionRows.map((row) => {
                const labelLocale = fieldLocaleMap?.[row.fieldId]?.options?.[row.optionValue];
                const childPreset = row.childPreset;
                return (
                  <div
                    key={`${row.fieldId}:${row.optionValue}`}
                    className="border-t border-slate-100 px-3 py-2 first:border-t-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex shrink-0 items-center justify-center pt-0.5">
                        {row.icon ? (
                          row.iconBroken ? (
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded border border-red-300 bg-red-50 text-[10px] font-semibold text-red-700"
                              title={`Missing icon: ${row.icon}`}
                            >
                              !
                            </span>
                          ) : (
                            <img
                              src={getIconSvgDataUrl(row.icon) ?? undefined}
                              alt=""
                              className="h-5 w-5"
                              title={row.icon}
                            />
                          )
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center text-slate-300">
                            —
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-mono text-xs text-slate-500"
                          title={`${row.fieldId} · ${row.fieldKey}=${row.optionValue}`}
                        >
                          {row.fieldId} · {row.optionValue}
                        </p>
                        {locale ? (
                          <TranslationRow
                            label=""
                            en={row.labelEn}
                            localized={labelLocale}
                            same={Boolean(labelLocale && labelLocale === row.labelEn)}
                            compact
                          />
                        ) : (
                          <p className="mt-0.5 text-sm text-slate-900">{row.labelEn}</p>
                        )}
                        {childPreset ? (
                          <button
                            type="button"
                            onClick={() => onOpenPreset(childPreset.id)}
                            className="mt-1 text-xs font-medium text-sky-600 hover:underline"
                          >
                            → {childPreset.name}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <PresetJsonPanel preset={preset} />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {categorySections.map((section) => (
            <RelatedBlock
              key={section.title}
              title={section.title}
              count={section.related.length}
              onTitleClick={section.onListClick}
              presets={section.related}
              onOpenPreset={onOpenPreset}
            />
          ))}
          {preset.categoryNames.length === 0 && (
            <RelatedBlock
              title="Presets with no category"
              count={uncategorizedRelated.length}
              onTitleClick={() => onApplyFilter({ categoryNames: ["No Category"] })}
              presets={uncategorizedRelated}
              onOpenPreset={onOpenPreset}
            />
          )}
          {iconId ? (
            <RelatedBlock
              title={`Presets with this icon \`${iconId}\``}
              count={iconRelated.length}
              onTitleClick={() => onApplyFilter({ iconName: [iconId] })}
              presets={iconRelated}
              onOpenPreset={onOpenPreset}
            />
          ) : null}
        </div>
      </CatalystDialogBody>
    </>
  );
}

/**
 * Collapsible raw-JSON view of the full preset, with each field reference
 * expanded to its full definition (key, type, options, …) so you see the whole
 * picture. The open/closed state lives in the global zustand store, so toggling
 * it once keeps it open as you browse from preset to preset.
 */
function PresetJsonPanel({ preset }: { preset: DenormalizedPreset }) {
  const { fields } = useSchema();
  const open = useUiStore((s) => s.presetJsonOpen);
  const toggle = useUiStore((s) => s.togglePresetJson);

  const expandFields = (ids: string[] | undefined) =>
    Object.fromEntries((ids ?? []).map((id) => [id, fields[id] ?? null]));
  const expanded = {
    ...preset,
    fields: expandFields(preset.fields),
    moreFields: expandFields(preset.moreFields),
  };
  const json = JSON.stringify(expanded, null, 2);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-200"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-x-2">
          <span>Full preset (JSON, fields expanded)</span>
          <code className="truncate font-mono text-xs font-normal text-slate-400">
            data/presets/{preset.id}.json
          </code>
        </span>
        <span aria-hidden className="text-slate-500">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700">
          {json}
        </pre>
      ) : null}
    </div>
  );
}

function TranslationRow({
  label,
  en,
  localized,
  same,
  compact,
}: {
  label: string;
  en: string;
  localized?: string;
  same?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        "grid gap-x-4 border-t border-slate-100 text-sm first:border-t-0",
        compact ? "grid-cols-[1fr_1fr]" : "grid-cols-[5rem_1fr_1fr] px-3 py-2",
      )}
    >
      {!compact ? (
        <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</div>
      ) : null}
      <div className="min-w-0 text-slate-900">
        {en || <span className="text-slate-300">—</span>}
      </div>
      <div className="min-w-0">
        {localized ? (
          <span
            className={clsx("text-slate-900", same && "text-amber-700")}
            title={same ? "Same as English" : undefined}
          >
            {localized}
          </span>
        ) : compact ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
            untranslated
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
            untranslated
          </span>
        )}
      </div>
    </div>
  );
}

function RelatedBlock({
  title,
  count,
  onTitleClick,
  presets,
  onOpenPreset,
}: {
  title: string;
  count: number;
  onTitleClick: () => void;
  presets: RelatedItem[];
  onOpenPreset: (id: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
        <button type="button" onClick={onTitleClick} className="min-w-0 text-left hover:underline">
          {title}
        </button>
        <CountPill>{count}</CountPill>
      </h2>
      {presets.length === 0 ? (
        <p className="text-sm text-slate-500">No related presets.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {presets.slice(0, 30).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenPreset(p.id)}
              title={p.id}
              className="max-w-full truncate rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 ring-inset hover:bg-slate-100"
            >
              {p.name}
            </button>
          ))}
          {presets.length > 30 ? (
            <span className="self-center text-xs text-slate-400">+{presets.length - 30} more</span>
          ) : null}
        </div>
      )}
    </section>
  );
}
