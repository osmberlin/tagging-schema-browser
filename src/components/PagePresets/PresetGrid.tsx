import { PresetCard } from "./PresetCard";
import { usePresetSearch } from "./usePresetSearch";
import { useSearchState } from "./useSearchState";

export function PresetGrid() {
  const result = usePresetSearch();
  const [, setState] = useSearchState();
  if (!result) return null;
  const { items, total, page, per_page } = result.data;
  const totalPages = Math.max(1, Math.ceil(total / per_page));
  return (
    <div className="space-y-5">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {total} preset{total !== 1 ? "s" : ""}
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          No presets match. Try clearing filters or changing the search query.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((preset) => (
            <li key={preset.id}>
              <PresetCard preset={preset} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setState({ page: page - 1 })}
            className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Page {page}</span>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setState({ page: page + 1 })}
            className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Next
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">of {totalPages}</span>
        </div>
      </div>
    </div>
  );
}
