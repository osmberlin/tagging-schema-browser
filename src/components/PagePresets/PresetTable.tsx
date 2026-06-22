import { getIconSvgDataUrl, isPresetIconBroken } from "@/components/PageIcons/iconRegistry";
import { useComparison } from "@/contexts/ComparisonContext";
import { useSchema } from "@/contexts/SchemaContext";
import { getPresetOptionIconNames } from "@/utils/fieldOptions";
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

function ExpandIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 4H5a1 1 0 0 0-1 1v4m11-5h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4m11 5h4a1 1 0 0 0 1-1v-4"
      />
    </svg>
  );
}

function IconNameCell({ iconName, broken }: { iconName: string; broken: boolean }) {
  const src = getIconSvgDataUrl(iconName);
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {src ? (
        <img src={src} alt="" className="h-5 w-5 shrink-0" />
      ) : broken ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-red-300 bg-red-50 text-[10px] font-semibold text-red-700"
          title="Missing icon asset"
        >
          !
        </span>
      ) : null}
      <span
        className={clsx("min-w-0 truncate font-mono text-xs", broken && "font-medium text-red-700")}
        title={iconName}
      >
        {iconName}
      </span>
    </span>
  );
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

type CellLink = {
  search: (prev: { dataUrl?: string; locale?: string }) => Record<string, unknown>;
  title: string;
};

type Row = {
  label: string;
  labelTitle?: string;
  mono?: boolean;
  render: (p: DenormalizedPreset) => ReactNode;
  title?: (p: DenormalizedPreset) => string | undefined;
  highlight?: (p: DenormalizedPreset) => boolean;
  errorHighlight?: (p: DenormalizedPreset) => boolean;
  link?: (p: DenormalizedPreset) => CellLink | null;
};
type Section = { title: string; rows: Row[] };

export function PresetTable() {
  const { data } = useSchema();
  const { result: comparison } = useComparison();
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

  const iconCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data?.presets ?? []) {
      if (p.icon) m.set(p.icon, (m.get(p.icon) ?? 0) + 1);
    }
    return m;
  }, [data]);

  const sections = useMemo<Section[]>(() => {
    const presets = result?.data.items ?? [];
    const fields = data?.fields ?? {};
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
                      locale: prev.locale ?? "",
                      categoryNames: p.categoryNames,
                    }),
                    title: "Show all presets of this category",
                  }
                : null,
          },
          {
            label: "Icon",
            render: (p) => {
              if (!p.icon) return dash;
              return <IconNameCell iconName={p.icon} broken={p.iconBroken} />;
            },
            highlight: (p) => p.iconBroken,
            errorHighlight: (p) => p.iconBroken,
            link: (p) =>
              p.icon && (iconCounts.get(p.icon) ?? 0) > 1
                ? {
                    search: (prev) => ({
                      ...presetSearchDefaults,
                      dataUrl: prev.dataUrl ?? "",
                      locale: prev.locale ?? "",
                      iconName: [p.icon as string],
                    }),
                    title: "Show all presets of this icon",
                  }
                : null,
          },
          {
            label: "Options icons",
            labelTitle: "Icons used by field options on this preset",
            render: (p) => {
              const icons = getPresetOptionIconNames(p, fields);
              if (icons.length === 0) return dash;
              return (
                <span className="flex flex-col gap-1">
                  {icons.map((iconName) => (
                    <IconNameCell
                      key={iconName}
                      iconName={iconName}
                      broken={isPresetIconBroken(iconName)}
                    />
                  ))}
                </span>
              );
            },
            highlight: (p) =>
              getPresetOptionIconNames(p, fields).some((icon) => isPresetIconBroken(icon)),
            errorHighlight: (p) =>
              getPresetOptionIconNames(p, fields).some((icon) => isPresetIconBroken(icon)),
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
  }, [result, iconCounts, data?.fields]);

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
              {presets.map((p) => {
                const status = comparison?.statusById.get(p.id);
                const changed = status === "added" || status === "modified";
                return (
                  <th
                    key={p.id}
                    className="sticky top-0 z-20 min-w-40 border-r border-b border-slate-200 bg-white p-0 text-left align-bottom"
                  >
                    <button
                      type="button"
                      onClick={() => setPreset(p.id)}
                      className="group/col relative block h-full w-full px-3 py-2 pr-8 text-left transition hover:bg-sky-50"
                      title="Show details of preset"
                    >
                      <span className="flex max-w-50 items-center gap-1.5 truncate font-display font-medium text-slate-900 group-hover/col:text-sky-700">
                        {changed ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-violet-500"
                            title={status === "added" ? "Added vs release" : "Modified vs release"}
                          />
                        ) : null}
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="block max-w-50 truncate font-mono text-[11px] text-slate-400">
                        {p.id}
                      </span>
                      <span
                        aria-hidden
                        className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover/col:bg-sky-100 group-hover/col:text-sky-700"
                        title="Open modal"
                      >
                        <ExpandIcon className="h-3 w-3" />
                      </span>
                    </button>
                  </th>
                );
              })}
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
                      const errorHighlighted = row.errorHighlight?.(p);
                      const infoHighlighted = !errorHighlighted && row.highlight?.(p);
                      return (
                        <td
                          key={p.id}
                          title={row.link ? undefined : row.title?.(p)}
                          className={clsx(
                            "border-r border-b border-slate-100 align-top text-slate-700",
                            row.mono && "font-mono text-xs",
                            row.link ? "h-0 p-0" : "px-3 py-1.5",
                            errorHighlighted
                              ? "bg-red-50/70"
                              : infoHighlighted
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
                                className={clsx(
                                  "group/ac relative flex h-full items-start px-3 py-1.5 pr-8 transition hover:bg-sky-50",
                                  errorHighlighted && "bg-red-50/70",
                                )}
                              >
                                <span className="min-w-0">{row.render(p)}</span>
                                <span
                                  aria-hidden
                                  className="absolute top-1/2 right-1 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 group-hover/ac:flex"
                                >
                                  ›
                                </span>
                              </Link>
                            ) : (
                              <span
                                className={clsx(
                                  "block h-full px-3 py-1.5",
                                  errorHighlighted && "bg-red-50/70",
                                )}
                              >
                                {row.render(p)}
                              </span>
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
