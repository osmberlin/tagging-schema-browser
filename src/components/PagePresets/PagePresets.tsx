import { CountPill } from "@/components/ui/CountPill";
import { Input } from "@/components/ui/Input";
import { useSchema } from "@/contexts/SchemaContext";
import { DEFAULT_CDN } from "@/contexts/SchemaContext";
import { Fragment, useMemo } from "react";
import { PresetTable } from "./PresetTable";
import { getExpectedFilesHelp } from "./dataLoader";
import { usePresetSearch } from "./usePresetSearch";
import { useSearchState } from "./useSearchState";

export function PagePresets() {
  const { dataUrl, setDataUrl, load, loading, error, data } = useSchema();
  const [searchState, setSearchState] = useSearchState();
  const totalCount = usePresetSearch()?.data.total ?? 0;
  const brokenIconCount = useMemo(
    () => data?.presets.filter((preset) => preset.iconBroken).length ?? 0,
    [data],
  );

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
      facet: "primaryTagKey",
      label: `Primary: ${value}`,
      onRemove: () => removeValue("primaryTagKey", value),
    })),
    ...searchState.geometry.map((value) => ({
      key: `geometry-${value}`,
      facet: "geometry",
      label: `Geometry: ${value}`,
      onRemove: () => removeValue("geometry", value),
    })),
    ...searchState.iconPrefix.map((value) => ({
      key: `iconPrefix-${value}`,
      facet: "iconPrefix",
      label: `Icon set: ${value}`,
      onRemove: () => removeValue("iconPrefix", value),
    })),
    ...searchState.fieldIds.map((value) => ({
      key: `field-${value}`,
      facet: "fieldIds",
      label: `Field: ${value}`,
      onRemove: () => removeValue("fieldIds", value),
    })),
    ...searchState.categoryNames.map((value) => ({
      key: `category-${value}`,
      facet: "categoryNames",
      label: `Category: ${value}`,
      onRemove: () => removeValue("categoryNames", value),
    })),
    ...searchState.hasIcon.map((value) => ({
      key: `hasIcon-${value}`,
      facet: "hasIcon",
      label: `Has icon: ${value}`,
      onRemove: () => removeValue("hasIcon", value),
    })),
    ...searchState.iconName.map((value) => ({
      key: `iconName-${value}`,
      facet: "iconName",
      label: `Icon: ${value}`,
      onRemove: () => removeValue("iconName", value),
    })),
    ...(searchState.q
      ? [
          {
            key: "query",
            facet: "query",
            label: `Search: ${searchState.q}`,
            onRemove: () => setSearchState({ q: "", page: 1 }),
          },
        ]
      : []),
  ];

  if (!dataUrl && !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Load schema data</h2>
        <p className="text-sm text-slate-600">
          Enter the base URL of the id-tagging-schema{" "}
          <code className="rounded bg-slate-200 px-1">dist/</code> folder. For PR previews, use the
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
        <p className="text-xs text-slate-500">{getExpectedFilesHelp()}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
        <div className="h-[60vh] animate-pulse rounded-lg bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="font-semibold text-red-800">Load error</h2>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <p className="mt-2 text-xs text-red-600">{getExpectedFilesHelp()}</p>
        <button
          type="button"
          onClick={() => setDataUrl(null)}
          className="mt-3 text-sm font-medium text-red-700 underline"
        >
          Enter a different URL
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          Presets <CountPill className="text-sm">{totalCount}</CountPill>
        </h1>
        {activePills.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {activePills.map((pill, i) => (
              <Fragment key={pill.key}>
                {i > 0 ? (
                  <span className="text-[11px] font-medium text-slate-400">
                    {activePills[i - 1].facet === pill.facet ? "or" : "and"}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={pill.onRemove}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  <span>{pill.label}</span>
                  <span aria-hidden>×</span>
                </button>
              </Fragment>
            ))}
          </div>
        ) : null}
      </div>
      {brokenIconCount > 0 ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <strong>{brokenIconCount}</strong>{" "}
          {brokenIconCount === 1 ? "preset references" : "presets reference"} a missing icon —{" "}
          <button
            type="button"
            onClick={() => setSearchState({ hasIcon: ["broken"], page: 1 })}
            className="font-medium text-red-900 underline hover:text-red-950"
          >
            show broken icons
          </button>
          .
        </p>
      ) : null}
      <PresetTable />
    </div>
  );
}
