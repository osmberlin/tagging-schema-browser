import { Input } from "@/components/ui/Input";
import { useSchema } from "@/contexts/SchemaContext";
import { DEFAULT_CDN } from "@/contexts/SchemaContext";
import { PresetGrid } from "./PresetGrid";
import { getExpectedFilesHelp } from "./dataLoader";
import { useSearchState } from "./useSearchState";

export function PagePresets() {
  const { dataUrl, setDataUrl, load, loading, error, data } = useSchema();
  const [searchState, setSearchState] = useSearchState();

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
      <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Load schema data</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter the base URL of the id-tagging-schema{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">dist/</code> folder. For PR
          previews, use the preview dist URL.
        </p>
        <form onSubmit={handleLoad} className="flex flex-col gap-2">
          <Input name="dataUrl" type="url" placeholder={DEFAULT_CDN} defaultValue={DEFAULT_CDN} />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Load
          </button>
        </form>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{getExpectedFilesHelp()}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h2 className="font-semibold text-red-800 dark:text-red-200">Load error</h2>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{getExpectedFilesHelp()}</p>
        <button
          type="button"
          onClick={() => setDataUrl(null)}
          className="mt-3 text-sm font-medium text-red-700 underline dark:text-red-300"
        >
          Enter a different URL
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Presets</h1>
          {activePills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activePills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={pill.onRemove}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <span>{pill.label}</span>
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            value={searchState.sort}
            onChange={(e) => setSearchState({ sort: e.target.value as "name_asc" | "name_desc" })}
          >
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
        </div>
      </div>
      <PresetGrid />
    </div>
  );
}
