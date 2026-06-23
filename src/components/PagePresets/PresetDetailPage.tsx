import type { PresetFilterUpdate } from "@/components/PagePresets/PresetDetailModal.types";
import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { PresetSourceTree } from "@/components/PagePresets/PresetSourceTree";
import { PresetTranslationTable } from "@/components/PagePresets/PresetTranslationTable";
import { GeometryIcons } from "@/components/PagePresets/geometryIcons";
import { presetSearchDefaults, useSetPreset } from "@/components/PagePresets/useSearchState";
import { CountPill } from "@/components/ui/CountPill";
import { DetailDisclosure } from "@/components/ui/DetailDisclosure";
import { useComparison } from "@/contexts/ComparisonContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useSchema } from "@/contexts/SchemaContext";
import { githubFileUrl, schemaRepoPath } from "@/utils/githubFileUrl";
import type { DenormalizedPreset } from "@/utils/types";
import { useNavigate, useParams } from "@tanstack/react-router";

type RelatedItem = { id: string; name: string };

export function PresetDetailPage() {
  const { _splat: presetId } = useParams({ strict: false });
  const { presetsById, presets, rawPresets, dataUrl, loading, error } = useSchema();
  const preset = presetId ? presetsById.get(presetId) : undefined;
  const raw = presetId ? rawPresets[presetId] : undefined;

  if (!presetId) {
    return <p className="text-sm text-slate-600">No preset id in URL.</p>;
  }

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

  if (!preset || !raw) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Preset not found</h1>
        <p className="text-sm text-slate-600">
          No preset matches <code className="font-mono text-xs">{presetId}</code> for the loaded
          schema.
        </p>
      </div>
    );
  }

  return (
    <PresetDetailContent
      preset={preset}
      raw={raw as Record<string, unknown>}
      presets={presets}
      dataUrl={dataUrl ?? ""}
    />
  );
}

function PresetDetailContent({
  preset,
  raw,
  presets,
  dataUrl,
}: {
  preset: DenormalizedPreset;
  raw: Record<string, unknown>;
  presets: DenormalizedPreset[];
  dataUrl: string;
}) {
  const navigate = useNavigate();
  const setPreset = useSetPreset();
  const { locale, localeMap, loading: localeLoading, error: localeError } = useLocale();
  const loc = locale ? localeMap?.get(preset.id) : undefined;

  const { result: comparison } = useComparison();
  const changeStatus = comparison?.statusById.get(preset.id);
  const modified = comparison?.modified.find((m) => m.current.id === preset.id);

  const filePath = schemaRepoPath("preset", preset.id);
  const githubUrl = githubFileUrl(dataUrl, filePath);

  const toItem = (c: DenormalizedPreset): RelatedItem => ({ id: c.id, name: c.name });

  const onApplyFilter = (update: PresetFilterUpdate) => {
    void navigate({
      to: "/",
      search: (prev) => ({
        ...presetSearchDefaults,
        dataUrl: prev.dataUrl ?? "",
        locale: prev.locale ?? "",
        ...update,
        page: 1,
      }),
    });
  };

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
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
          <PresetIconBox preset={preset} size="md" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-slate-950">{preset.name}</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">{preset.id}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Geometry</span>
              <GeometryIcons geometry={preset.geometry} />
            </div>
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
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          View source ↗
        </a>
      </header>

      <DetailDisclosure
        title="Translation"
        subtitle={
          locale ? (
            <>
              EN ↔ <span className="font-mono">{locale}</span>
            </>
          ) : (
            "English"
          )
        }
        defaultOpen
      >
        {locale && localeLoading ? (
          <p className="px-4 py-3 text-sm text-slate-500">Loading {locale}…</p>
        ) : locale && localeError ? (
          <p className="mx-4 my-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {localeError}
          </p>
        ) : (
          <PresetTranslationTable
            preset={preset}
            locale={locale}
            localized={loc ? { name: loc.name, terms: loc.terms, aliases: loc.aliases } : undefined}
          />
        )}
      </DetailDisclosure>

      <DetailDisclosure
        title="Source preset"
        actions={
          <>
            <code className="font-mono text-xs text-slate-500">{filePath}</code>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-sky-600 ring-1 ring-sky-100 ring-inset hover:bg-sky-50"
            >
              GitHub ↗
            </a>
          </>
        }
        defaultOpen
      >
        <PresetSourceTree key={preset.id} presetId={preset.id} raw={raw} />
      </DetailDisclosure>

      {changeStatus === "added" || changeStatus === "modified" ? (
        <DetailDisclosure
          title={changeStatus === "added" ? "Added vs release" : "Changes vs release"}
          defaultOpen
          className="border-violet-200 bg-violet-50/40"
        >
          <div className="px-4 py-3">
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
        </DetailDisclosure>
      ) : null}

      <DetailDisclosure title="Related presets">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {categorySections.map((section) => (
            <RelatedBlock
              key={section.title}
              title={section.title}
              count={section.related.length}
              onTitleClick={section.onListClick}
              presets={section.related}
              onOpenPreset={setPreset}
            />
          ))}
          {preset.categoryNames.length === 0 && (
            <RelatedBlock
              title="Presets with no category"
              count={uncategorizedRelated.length}
              onTitleClick={() => onApplyFilter({ categoryNames: ["No Category"] })}
              presets={uncategorizedRelated}
              onOpenPreset={setPreset}
            />
          )}
          {iconId ? (
            <RelatedBlock
              title={`Presets with this icon \`${iconId}\``}
              count={iconRelated.length}
              onTitleClick={() => onApplyFilter({ iconName: [iconId] })}
              presets={iconRelated}
              onOpenPreset={setPreset}
            />
          ) : null}
        </div>
      </DetailDisclosure>
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
