import { Kbd } from "@/components/ui/Kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { PresetCard } from "./PresetCard";
import { usePresetSearch } from "./usePresetSearch";
import { useSearchState } from "./useSearchState";

export function PresetGrid() {
  const result = usePresetSearch();
  const [, setState] = useSearchState();
  const page = result?.data.page ?? 1;
  const total = result?.data.total ?? 0;
  const perPage = result?.data.per_page ?? 24;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // [ / ] page through results (ignored automatically while typing in inputs).
  useHotkey("[", () => {
    if (page > 1) setState({ page: page - 1 });
  });
  useHotkey("]", () => {
    if (page < totalPages) setState({ page: page + 1 });
  });

  if (!result) return null;
  const items = result.data.items;
  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-600">
        {total} preset{total !== 1 ? "s" : ""}
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
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

      <div className="flex items-center border-t border-slate-200 pt-4">
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setState({ page: page - 1 })}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
            <Kbd aria-hidden="true">[</Kbd>
          </button>
          <span className="text-sm text-slate-600">Page {page}</span>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setState({ page: page + 1 })}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <Kbd aria-hidden="true">]</Kbd>
          </button>
          <span className="text-sm text-slate-600">of {totalPages}</span>
        </div>
      </div>
    </div>
  );
}
