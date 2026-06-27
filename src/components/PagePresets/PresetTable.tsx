import { getIconSvgDataUrl, isIconSvgConfirmedMissing } from "@/components/PageIcons/iconRegistry";
import { GeometryIcons } from "@/components/PagePresets/geometryIcons";
import { AreaLink } from "@/components/ui/AreaLink";
import { AreaIcon, AreaLabel, type SchemaArea } from "@/components/ui/areaIcons";
import { useComparison } from "@/contexts/ComparisonContext";
import { useSchema } from "@/contexts/SchemaContext";
import { getPresetOptionIconNames } from "@/utils/fieldOptions";
import type { DenormalizedPreset } from "@/utils/types";
import { Link } from "@tanstack/react-router";
import { type VirtualItem, useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import { Fragment, type ReactNode, useMemo, useRef } from "react";
import { usePresetSearch } from "./usePresetSearch";
import { presetSearchDefaults, useSetPreset } from "./useSearchState";

const COLUMN_WIDTH = 160;

const dash = <span className="text-slate-300">—</span>;

function CellOverflow({
  children,
  truncate,
  wrap,
  breakText,
}: {
  children: ReactNode;
  truncate?: boolean;
  wrap?: boolean;
  /** Line break + hyphenation inside the fixed column (instead of ellipsis). */
  breakText?: boolean;
}) {
  return (
    <span
      className={clsx(
        "block min-w-0",
        truncate && "truncate",
        wrap && "break-all",
        breakText && "break-words hyphens-auto",
      )}
    >
      {children}
    </span>
  );
}

function renderCellContent(row: Row, preset: DenormalizedPreset) {
  const content = row.render(preset);
  if (row.truncate || row.wrap || row.breakText) {
    return (
      <CellOverflow truncate={row.truncate} wrap={row.wrap} breakText={row.breakText}>
        {content}
      </CellOverflow>
    );
  }
  return content;
}

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
  label: ReactNode;
  /** Stable key for table rows (defaults to string label when omitted). */
  rowKey?: string;
  labelTitle?: string;
  mono?: boolean;
  /** Truncate overflowing text with ellipsis; pair with `title` for the full value. */
  truncate?: boolean;
  /** Wrap with line breaks and hyphenation inside the fixed column. */
  breakText?: boolean;
  /** Break long unbroken strings (e.g. URLs) across lines inside the fixed column. */
  wrap?: boolean;
  render: (p: DenormalizedPreset) => ReactNode;
  title?: (p: DenormalizedPreset) => string | undefined;
  highlight?: (p: DenormalizedPreset) => boolean;
  /** Tailwind background class when `highlight` is true (default `bg-sky-50/70`). */
  highlightClass?: string;
  errorHighlight?: (p: DenormalizedPreset) => boolean;
  link?: (p: DenormalizedPreset) => CellLink | null;
};
type Section = { title: string; area?: SchemaArea; rows: Row[] };

function ColumnSpacer({ width, as: Tag = "th" }: { width: number; as?: "th" | "td" }) {
  if (width <= 0) return null;
  return (
    <Tag aria-hidden className="border-0 p-0" style={{ width, minWidth: width, maxWidth: width }} />
  );
}

function VirtualizedPresetColumns({
  presets,
  virtualColumns,
  paddingLeft,
  paddingRight,
  renderColumn,
  spacerAs = "th",
}: {
  presets: DenormalizedPreset[];
  virtualColumns: VirtualItem[];
  paddingLeft: number;
  paddingRight: number;
  renderColumn: (preset: DenormalizedPreset, index: number) => ReactNode;
  spacerAs?: "th" | "td";
}) {
  return (
    <>
      <ColumnSpacer width={paddingLeft} as={spacerAs} />
      {virtualColumns.map((virtualColumn) => {
        const preset = presets[virtualColumn.index];
        if (!preset) return null;
        return <Fragment key={preset.id}>{renderColumn(preset, virtualColumn.index)}</Fragment>;
      })}
      <ColumnSpacer width={paddingRight} as={spacerAs} />
    </>
  );
}
function PresetHeaderCell({
  preset,
  changed,
  status,
  onOpen,
}: {
  preset: DenormalizedPreset;
  changed: boolean;
  status: string | undefined;
  onOpen: (id: string) => void;
}) {
  return (
    <th
      className="sticky top-0 z-20 overflow-hidden border-r border-b border-slate-200 bg-white p-0 text-left align-bottom"
      style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, maxWidth: COLUMN_WIDTH }}
    >
      <button
        type="button"
        onClick={() => onOpen(preset.id)}
        className="group/col relative block h-full w-full overflow-hidden px-3 py-2 pr-8 text-left transition hover:bg-sky-50"
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate font-display font-medium text-slate-900 group-hover/col:text-sky-700">
          {changed ? (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-violet-500"
              title={status === "added" ? "Added vs release" : "Modified vs release"}
            />
          ) : null}
          <span className="truncate" title={preset.name}>
            {preset.name}
          </span>
        </span>
        <span className="block truncate font-mono text-[11px] text-slate-400" title={preset.id}>
          {preset.id}
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
}

function PresetValueCell({
  preset,
  row,
}: {
  preset: DenormalizedPreset;
  row: Row;
}) {
  const cellLink = row.link?.(preset);
  const errorHighlighted = row.errorHighlight?.(preset);
  const infoHighlighted = !errorHighlighted && row.highlight?.(preset);
  const highlightClass = row.highlightClass ?? "bg-sky-50/70";

  return (
    <td
      title={row.link ? undefined : row.title?.(preset)}
      className={clsx(
        "overflow-hidden border-r border-b border-slate-100 align-top text-slate-700",
        row.mono && "font-mono text-xs",
        row.link ? "h-0 p-0" : "px-3 py-1.5",
        errorHighlighted
          ? "bg-red-50/70"
          : infoHighlighted
            ? highlightClass
            : !row.link && "group-hover:bg-slate-50",
      )}
      style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, maxWidth: COLUMN_WIDTH }}
    >
      {row.link ? (
        cellLink ? (
          <Link
            to="/"
            search={cellLink.search as never}
            title={cellLink.title}
            className={clsx(
              "group/ac relative flex h-full items-start overflow-hidden px-3 py-1.5 pr-8 transition hover:bg-sky-50",
              errorHighlighted && "bg-red-50/70",
            )}
          >
            <span className="min-w-0">{renderCellContent(row, preset)}</span>
            <span
              aria-hidden
              className="absolute top-1/2 right-1 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 group-hover/ac:flex"
            >
              ›
            </span>
          </Link>
        ) : (
          <span className={clsx("block h-full px-3 py-1.5", errorHighlighted && "bg-red-50/70")}>
            {renderCellContent(row, preset)}
          </span>
        )
      ) : (
        renderCellContent(row, preset)
      )}
    </td>
  );
}

export function PresetTable() {
  const { data } = useSchema();
  const { result: comparison } = useComparison();
  const result = usePresetSearch();
  const setPreset = useSetPreset();
  const scrollRef = useRef<HTMLDivElement>(null);

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
          { label: "ID", mono: true, truncate: true, render: (p) => p.id, title: (p) => p.id },
          { label: "Name", breakText: true, render: (p) => p.name, title: (p) => p.name },
          {
            label: "Terms",
            breakText: true,
            render: (p) => (p.terms.length ? p.terms.join(", ") : dash),
            title: (p) => p.terms.join(", "),
          },
          {
            label: "Aliases",
            breakText: true,
            render: (p) => (p.aliases.length ? p.aliases.join(", ") : dash),
            title: (p) => p.aliases.join(", "),
          },
          {
            label: "Geometry",
            render: (p) => (p.geometry.length ? <GeometryIcons geometry={p.geometry} /> : dash),
            title: (p) => (p.geometry.length ? p.geometry.join(", ") : undefined),
          },
          {
            label: "Category",
            truncate: true,
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
            title: (p) => p.icon ?? undefined,
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
            label: <AreaLabel area="icons">Options icons</AreaLabel>,
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
                      broken={isIconSvgConfirmedMissing(iconName)}
                    />
                  ))}
                </span>
              );
            },
            highlight: (p) =>
              getPresetOptionIconNames(p, fields).some((icon) => isIconSvgConfirmedMissing(icon)),
            errorHighlight: (p) =>
              getPresetOptionIconNames(p, fields).some((icon) => isIconSvgConfirmedMissing(icon)),
          },
          {
            label: "imageURL",
            mono: true,
            wrap: true,
            render: (p) => (p.imageURL ? p.imageURL : dash),
            title: (p) => p.imageURL,
          },
        ],
      },
      {
        title: `Tags (${tagKeys.length})`,
        rows: tagKeys.map((k) => ({
          label: k,
          mono: true,
          truncate: true,
          render: (p) => (p.tags && k in p.tags ? p.tags[k] : dash),
          title: (p) => (p.tags && k in p.tags ? `${k}=${p.tags[k]}` : undefined),
        })),
      },
      {
        title: `Fields (${fieldIds.length})`,
        area: "fields",
        rows: fieldIds.map((f) => ({
          rowKey: f,
          label: (
            <AreaLink
              area="fields"
              to="/field/$"
              params={{ _splat: f }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
              className="font-mono text-xs no-underline hover:underline"
              title={`Open field "${f}"`}
            >
              {f}
            </AreaLink>
          ),
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

  const presets = result?.data.items ?? [];
  const total = result?.data.total ?? 0;
  const truncated = total > presets.length;

  const columnVirtualizer = useVirtualizer({
    count: presets.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => COLUMN_WIDTH,
    horizontal: true,
    overscan: 3,
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalColumnWidth = columnVirtualizer.getTotalSize();
  const paddingLeft = virtualColumns[0]?.start ?? 0;
  const paddingRight = totalColumnWidth - (virtualColumns.at(-1)?.end ?? 0);

  if (!result) return null;

  if (presets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        No presets match. Try clearing filters or changing the search query.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {truncated ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Showing the first <strong>{presets.length}</strong> of <strong>{total}</strong> matching
          presets — add filters to narrow the comparison.
        </p>
      ) : null}
      <div
        ref={scrollRef}
        className="relative max-h-[calc(100svh-13rem)] overflow-auto rounded-xl border border-slate-200"
      >
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 border-r border-b border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-500">
                Property
              </th>
              <VirtualizedPresetColumns
                presets={presets}
                virtualColumns={virtualColumns}
                paddingLeft={paddingLeft}
                paddingRight={paddingRight}
                renderColumn={(preset) => {
                  const status = comparison?.statusById.get(preset.id);
                  const changed = status === "added" || status === "modified";
                  return (
                    <PresetHeaderCell
                      preset={preset}
                      changed={changed}
                      status={status}
                      onOpen={setPreset}
                    />
                  );
                }}
              />
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.title}>
                <tr>
                  <th className="sticky left-0 z-10 border-r border-b border-slate-200 bg-slate-100 px-3 py-1 text-left font-display text-xs font-medium tracking-wide text-slate-600">
                    {section.area ? (
                      <span className="inline-flex items-center gap-1.5">
                        <AreaIcon area={section.area} className="h-3 w-3 shrink-0" />
                        {section.title}
                      </span>
                    ) : (
                      section.title
                    )}
                  </th>
                  <th
                    colSpan={
                      virtualColumns.length + (paddingLeft > 0 ? 1 : 0) + (paddingRight > 0 ? 1 : 0)
                    }
                    className="border-b border-slate-200 bg-slate-100 px-0 py-1"
                    style={{ width: totalColumnWidth, minWidth: totalColumnWidth }}
                  />
                </tr>
                {section.rows.map((row) => (
                  <tr
                    key={row.rowKey ?? (typeof row.label === "string" ? row.label : section.title)}
                    className="group"
                  >
                    <th
                      title={row.labelTitle}
                      className={clsx(
                        "sticky left-0 z-10 border-r border-b border-slate-200 bg-white px-3 py-1.5 text-left align-top font-normal text-slate-600 group-hover:bg-slate-50",
                        row.mono && "font-mono text-xs",
                      )}
                    >
                      {row.label}
                    </th>
                    <VirtualizedPresetColumns
                      presets={presets}
                      virtualColumns={virtualColumns}
                      paddingLeft={paddingLeft}
                      paddingRight={paddingRight}
                      spacerAs="td"
                      renderColumn={(preset) => <PresetValueCell preset={preset} row={row} />}
                    />
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
