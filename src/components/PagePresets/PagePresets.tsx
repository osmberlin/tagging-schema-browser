import { CountPill } from "@/components/ui/CountPill";
import { Input } from "@/components/ui/Input";
import { useSchema } from "@/contexts/SchemaContext";
import { DEFAULT_CDN } from "@/contexts/SchemaContext";
import { clsx } from "clsx";
import { PresetDetailModal } from "./PresetDetailModal";
import { PresetGrid } from "./PresetGrid";
import { PresetTable } from "./PresetTable";
import { getExpectedFilesHelp } from "./dataLoader";
import { usePresetSearch } from "./usePresetSearch";
import { type SearchState, useSearchState, useSetPreset } from "./useSearchState";

const VIEWS: { value: SearchState["view"]; label: string; icon: React.ReactNode }[] = [
  {
    value: "cards",
    label: "Cards",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.2" />
        <rect x="9" y="1" width="6" height="6" rx="1.2" />
        <rect x="1" y="9" width="6" height="6" rx="1.2" />
        <rect x="9" y="9" width="6" height="6" rx="1.2" />
      </svg>
    ),
  },
  {
    value: "table",
    label: "Table",
    icon: (
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.25" />
        <path d="M1.75 6.25h12.5M1.75 9.75h12.5M6 2.75v10.5" />
      </svg>
    ),
  },
];

function ViewToggle({
  view,
  onChange,
}: {
  view: SearchState["view"];
  onChange: (view: SearchState["view"]) => void;
}) {
  return (
    <div className="inline-flex shrink-0 self-start rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
      {VIEWS.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={view === value}
          className={clsx(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition",
            view === value
              ? "bg-sky-50 text-sky-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

export function PagePresets() {
  const { dataUrl, setDataUrl, load, loading, error, data } = useSchema();
  const [searchState, setSearchState] = useSearchState();
  const setPreset = useSetPreset();
  const totalCount = usePresetSearch()?.data.total ?? 0;
  const presetParam = searchState.preset ?? null;

  const handleLoad = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[name="dataUrl"]');
    const url = input?.value?.trim();
    if (url) load(url);
  };

  const removeValue = (facet: keyof typeof searchState, value: string) => {
    if (!Array.isArray(searchState[facet])) return;
    const next = (searchState[facet] as string[]).filter((v) => v !== value);
    setSearchState({ [facet]: next, page: 1 });
  };

  const activePills = [
    ...searchState.primaryTagKey.map((value) => ({
      key: `primary-${value}`,
      label: `Primary: ${value}`,
      onRemove: () => removeValue("primaryTagKey", value),
    })),
    ...searchState.geometry.map((value) => ({
      key: `geometry-${value}`,
      label: `Geometry: ${value}`,
      onRemove: () => removeValue("geometry", value),
    })),
    ...searchState.iconPrefix.map((value) => ({
      key: `iconPrefix-${value}`,
      label: `Icon set: ${value}`,
      onRemove: () => removeValue("iconPrefix", value),
    })),
    ...searchState.fieldIds.map((value) => ({
      key: `field-${value}`,
      label: `Field: ${value}`,
      onRemove: () => removeValue("fieldIds", value),
    })),
    ...searchState.categoryNames.map((value) => ({
      key: `category-${value}`,
      label: `Category: ${value}`,
      onRemove: () => removeValue("categoryNames", value),
    })),
    ...searchState.hasIcon.map((value) => ({
      key: `hasIcon-${value}`,
      label: `Has icon: ${value}`,
      onRemove: () => removeValue("hasIcon", value),
    })),
    ...searchState.iconName.map((value) => ({
      key: `iconName-${value}`,
      label: `Icon: ${value}`,
      onRemove: () => removeValue("iconName", value),
    })),
    ...(searchState.q
      ? [
          {
            key: "query",
            label: `Search: ${searchState.q}`,
            onRemove: () => setSearchState({ q: "", page: 1 }),
          },
        ]
      : []),
  ];

  if (!dataUrl && !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6 ">
        <h2 className="text-lg font-semibold text-slate-900 ">Load schema data</h2>
        <p className="text-sm text-slate-600 ">
          Enter the base URL of the id-tagging-schema{" "}
          <code className="rounded bg-slate-200 px-1 ">dist/</code> folder. For PR previews, use the
          preview dist URL.
        </p>
        <form onSubmit={handleLoad} className="flex flex-col gap-2">
          <Input name="dataUrl" type="url" placeholder={DEFAULT_CDN} defaultValue={DEFAULT_CDN} />
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Load
          </button>
        </form>
        <p className="text-xs text-slate-500 ">{getExpectedFilesHelp()}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200 " />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-slate-200 " />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 ">
        <h2 className="font-semibold text-red-800 ">Load error</h2>
        <p className="mt-1 text-sm text-red-700 ">{error}</p>
        <p className="mt-2 text-xs text-red-600 ">{getExpectedFilesHelp()}</p>
        <button
          type="button"
          onClick={() => setDataUrl(null)}
          className="mt-3 text-sm font-medium text-red-700 underline "
        >
          Enter a different URL
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
            Presets <CountPill className="text-sm">{totalCount}</CountPill>
          </h1>
          {activePills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activePills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={pill.onRemove}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  <span>{pill.label}</span>
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <ViewToggle view={searchState.view} onChange={(view) => setSearchState({ view })} />
      </div>
      {searchState.view === "table" ? <PresetTable /> : <PresetGrid />}
      <PresetDetailModal
        open={Boolean(presetParam)}
        presetId={presetParam}
        onClose={() => setSearchState({ preset: undefined })}
        onApplyFilter={(u) => setSearchState({ ...u, preset: undefined, page: 1 })}
        onOpenPreset={(id) => setPreset(id)}
      />
    </div>
  );
}
