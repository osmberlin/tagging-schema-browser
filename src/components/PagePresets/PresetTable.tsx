import { getIconSvgDataUrl } from "@/components/PageIcons/iconRegistry";
import { useSchema } from "@/contexts/SchemaContext";
import type { DenormalizedPreset } from "@/utils/types";
import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { Fragment, type ReactNode, useMemo } from "react";
import { searchPresets } from "./presetSearch";
import {
  filtersFromState,
  presetSearchDefaults,
  useSearchState,
  useSetPreset,
} from "./useSearchState";

const MAX_COLUMNS = 25;

const dash = <span className="text-slate-300">—</span>;

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

type CellLink = { search: (prev: { dataUrl?: string }) => Record<string, unknown>; title: string };

type Row = {
  label: string;
  /** Tooltip for the row label (explains the dimension). */
  labelTitle?: string;
  mono?: boolean;
  render: (p: DenormalizedPreset) => ReactNode;
  /** Native tooltip for the value cell. */
  title?: (p: DenormalizedPreset) => string | undefined;
  /** Cells where this returns true get a subtle highlight background. */
  highlight?: (p: DenormalizedPreset) => boolean;
  /** Turns the cell into a click-through that filters presets (with a `›` affordance). */
  link?: (p: DenormalizedPreset) => CellLink | null;
};
type Section = { title: string; rows: Row[] };

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
          { label: "ID", mono: true, render: (p) => p.id, title: (p) => p.id },
          { label: "Name", render: (p) => p.name, title: (p) => p.name },
          {
            label: "Terms",
            render: (p) => (p.terms.length ? p.terms.join(", ") : dash),
            title: (p) => p.terms.join(", "),
          },
          {
            label: "Aliases",
            render: (p) => (p.aliases.length ? p.aliases.join(", ") : dash),
            title: (p) => p.aliases.join(", "),
          },
          {
            label: "Geometry",
            render: (p) => (p.geometry.length ? p.geometry.join(", ") : dash),
          },
          {
            label: "Category",
            render: (p) => (p.categoryNames.length ? p.categoryNames.join(", ") : dash),
            link: (p) =>
              p.categoryNames.length
                ? {
                    search: (prev) => ({
                      ...presetSearchDefaults,
                      dataUrl: prev.dataUrl ?? "",
                      categoryNames: p.categoryNames,
                    }),
                    title: `Show all presets in category "${p.categoryNames.join(", ")}"`,
                  }
                : null,
          },
          {
            label: "Icon",
            render: (p) => {
              if (!p.icon) return dash;
              const src = getIconSvgDataUrl(p.icon);
              return (
                <span className="flex items-center gap-1.5">
                  {src ? <img src={src} alt="" className="h-5 w-5 shrink-0" /> : null}
                  <span className="font-mono text-xs">{p.icon}</span>
                </span>
              );
            },
            link: (p) =>
              p.icon
                ? {
                    search: (prev) => ({
                      ...presetSearchDefaults,
                      dataUrl: prev.dataUrl ?? "",
                      iconName: [p.icon as string],
                    }),
                    title: `Show all presets using the icon "${p.icon}"`,
                  }
                : null,
          },
          {
            label: "imageURL",
            mono: true,
            render: (p) => (p.imageURL ? <span className="break-all">{p.imageURL}</span> : dash),
            title: (p) => p.imageURL,
          },
        ],
      },
      {
        title: `Tags (${tagKeys.length})`,
        rows: tagKeys.map((k) => ({
          label: k,
          mono: true,
          render: (p) => (p.tags && k in p.tags ? p.tags[k] : dash),
          title: (p) => (p.tags && k in p.tags ? `${k}=${p.tags[k]}` : undefined),
        })),
      },
      {
        title: `Fields (${fieldIds.length})`,
        rows: fieldIds.map((f) => ({
          label: f,
          mono: true,
          highlight: (p) => p.fields.includes(f) || p.moreFields.includes(f),
          title: (p) =>
            p.fields.includes(f)
              ? `Uses field "${f}"`
              : p.moreFields.includes(f)
                ? `Uses field "${f}" (secondary)`
                : `Does not use "${f}"`,
          render: (p) =>
            p.fields.includes(f) ? (
              <span className="font-semibold text-sky-700">✓</span>
            ) : p.moreFields.includes(f) ? (
              <span className="text-sky-500">○</span>
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
                  className="sticky top-0 z-20 min-w-40 border-r border-b border-slate-200 bg-white p-0 text-left align-bottom"
                >
                  <button
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className="group/col block h-full w-full px-3 py-2 text-left transition hover:bg-sky-50"
                    title={`Open ${p.name} details`}
                  >
                    <span className="block max-w-50 truncate font-display font-medium text-slate-900 group-hover/col:text-sky-700">
                      {p.name}
                    </span>
                    <span className="block max-w-50 truncate font-mono text-[11px] text-slate-400">
                      {p.id}
                    </span>
                  </button>
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
                      title={row.labelTitle}
                      className={clsx(
                        "sticky left-0 z-10 border-r border-b border-slate-200 bg-white px-3 py-1.5 text-left align-top font-normal text-slate-600 group-hover:bg-slate-50",
                        row.mono && "font-mono text-xs",
                      )}
                    >
                      {row.label}
                    </th>
                    {presets.map((p) => {
                      const cellLink = row.link?.(p);
                      return (
                        <td
                          key={p.id}
                          title={row.link ? undefined : row.title?.(p)}
                          className={clsx(
                            "border-r border-b border-slate-100 align-top text-slate-700",
                            row.mono && "font-mono text-xs",
                            row.link ? "p-0" : "px-3 py-1.5",
                            !row.link && row.highlight?.(p)
                              ? "bg-sky-50/70"
                              : !row.link && "group-hover:bg-slate-50",
                          )}
                        >
                          {row.link ? (
                            cellLink ? (
                              <Link
                                to="/"
                                search={cellLink.search as never}
                                title={cellLink.title}
                                className="group/ac relative block px-3 py-1.5 transition hover:bg-sky-50"
                              >
                                {row.render(p)}
                                <span
                                  aria-hidden
                                  className="absolute top-1/2 right-1 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 group-hover/ac:flex"
                                >
                                  ›
                                </span>
                              </Link>
                            ) : (
                              <span className="block px-3 py-1.5">{row.render(p)}</span>
                            )
                          ) : (
                            row.render(p)
                          )}
                        </td>
                      );
                    })}
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
