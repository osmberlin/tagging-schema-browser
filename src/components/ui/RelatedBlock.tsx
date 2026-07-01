import { type SearchState, presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { AreaLink } from "@/components/ui/AreaLink";
import { CountPill } from "@/components/ui/CountPill";
import type { SchemaArea } from "@/components/ui/areaIcons";
import { Link } from "@tanstack/react-router";

type RelatedItem = { id: string; name: string };

type RelatedBlockProps = {
  title: string;
  count: number;
  area?: SchemaArea;
  titleFilter: Partial<SearchState>;
  presets: RelatedItem[];
};

export function RelatedBlock({
  title,
  count,
  area = "presets",
  titleFilter,
  presets,
}: RelatedBlockProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
        <AreaLink
          area={area}
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? "",
            locale: prev.locale ?? "",
            ...titleFilter,
            page: 1,
          })}
          className="min-w-0 text-left no-underline hover:underline"
        >
          {title}
        </AreaLink>
        <CountPill>{count}</CountPill>
      </h2>
      {presets.length === 0 ? (
        <p className="text-sm text-slate-500">No related presets.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {presets.slice(0, 30).map((p) => (
            <Link
              key={p.id}
              to="/preset/$"
              params={{ _splat: p.id }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
              title={p.id}
              className="max-w-full truncate rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 ring-inset hover:bg-slate-100"
            >
              {p.name}
            </Link>
          ))}
          {presets.length > 30 ? (
            <span className="self-center text-xs text-slate-400">+{presets.length - 30} more</span>
          ) : null}
        </div>
      )}
    </section>
  );
}
