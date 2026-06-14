import { useSchema } from "@/contexts/SchemaContext";
import type { DenormalizedPreset } from "@/utils/types";
import { clsx } from "clsx";
import { Fragment, type ReactNode, useMemo } from "react";
import { searchPresets } from "./presetSearch";
import { filtersFromState, useSearchState, useSetPreset } from "./useSearchState";

const MAX_COLUMNS = 25;

const dash = <span className="text-slate-300">—</span>;

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

type Row = { label: string; mono?: boolean; render: (p: DenormalizedPreset) => ReactNode };
type Section = { title: string; rows: Row[] };

/**
 * Comparison table inspired by osm-deep-history: presets are columns, every
 * property is a row (grouped by dimension), cells hold the values. Capped at
 * 25 presets — beyond that the user must filter.
 */
export function PresetTable() {
  const { data } = useSchema();
  const [state] = useSearchState();
  const setPreset = useSetPreset();

  const result = useMemo(() => {
    if (!data) return null;
    return searchPresets({
      query: state.q,
      filters: filtersFromState(state),
      page: 1,
      per_page: MAX_COLUMNS,
      sort: state.sort,
    });
  }, [data, state]);

  const sections = useMemo<Section[]>(() => {
    const presets = result?.data.items ?? [];
    const tagKeys = uniqueSorted(presets.flatMap((p) => Object.keys(p.tags ?? {})));
    const fieldIds = uniqueSorted(presets.flatMap((p) => [...p.fields, ...p.moreFields]));
    return [
      {
        title: "Identity",
        rows: [
          { label: "ID", mono: true, render: (p) => p.id },
          { label: "Name", render: (p) => p.name },
          { label: "Terms", render: (p) => (p.terms.length ? p.terms.join(", ") : dash) },
          { label: "Aliases", render: (p) => (p.aliases.length ? p.aliases.join(", ") : dash) },
          { label: "Geometry", render: (p) => (p.geometry.length ? p.geometry.join(", ") : dash) },
          {
            label: "Category",
            render: (p) => (p.categoryNames.length ? p.categoryNames.join(", ") : dash),
          },
          { label: "Icon", mono: true, render: (p) => p.icon ?? dash },
          {
            label: "imageURL",
            mono: true,
            render: (p) => (p.imageURL ? <span className="break-all">{p.imageURL}</span> : dash),
          },
        ],
      },
      {
        title: `Tags (${tagKeys.length})`,
        rows: tagKeys.map((k) => ({
          label: k,
          mono: true,
          render: (p) => (p.tags && k in p.tags ? p.tags[k] : dash),
        })),
      },
      {
        title: `Fields (${fieldIds.length})`,
        rows: fieldIds.map((f) => ({
          label: f,
          mono: true,
          render: (p) =>
            p.fields.includes(f) ? (
              <span className="font-semibold text-sky-600">✓</span>
            ) : p.moreFields.includes(f) ? (
              <span className="text-slate-400" title="more field">
                ○
              </span>
            ) : (
              dash
            ),
        })),
      },
    ];
  }, [result]);

  if (!result) return null;
  const presets = result.data.items;
  const total = result.data.total;

  if (presets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        No presets match. Try clearing filters or changing the search query.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {total > MAX_COLUMNS ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Comparing the first <strong>{MAX_COLUMNS}</strong> of <strong>{total}</strong> presets —
          add filters to narrow the comparison.
        </p>
      ) : null}
      <div className="relative max-h-[calc(100svh-13rem)] overflow-auto rounded-xl border border-slate-200">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 border-r border-b border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-500">
                Property
              </th>
              {presets.map((p) => (
                <th
                  key={p.id}
                  className="sticky top-0 z-20 min-w-40 border-r border-b border-slate-200 bg-white px-3 py-2 text-left align-bottom"
                >
                  <button
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className="block max-w-50 truncate font-display font-medium text-slate-900 hover:text-sky-600"
                    title={`Open ${p.name}`}
                  >
                    {p.name}
                  </button>
                  <span className="block max-w-50 truncate font-mono text-[11px] text-slate-400">
                    {p.id}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.title}>
                <tr>
                  <th
                    colSpan={presets.length + 1}
                    className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-left font-display text-xs font-medium tracking-wide text-slate-600"
                  >
                    {section.title}
                  </th>
                </tr>
                {section.rows.map((row) => (
                  <tr key={row.label} className="group">
                    <th
                      className={clsx(
                        "sticky left-0 z-10 border-r border-b border-slate-200 bg-white px-3 py-1.5 text-left align-top font-normal text-slate-600 group-hover:bg-slate-50",
                        row.mono && "font-mono text-xs",
                      )}
                    >
                      {row.label}
                    </th>
                    {presets.map((p) => (
                      <td
                        key={p.id}
                        className={clsx(
                          "border-r border-b border-slate-100 px-3 py-1.5 align-top text-slate-700 group-hover:bg-slate-50",
                          row.mono && "font-mono text-xs",
                        )}
                      >
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
