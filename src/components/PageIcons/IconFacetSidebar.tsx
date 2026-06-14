import { SidebarSection } from "@/components/ui/Sidebar";
import { useSchema } from "@/contexts/SchemaContext";
import { clsx } from "clsx";
import { useIconFacetMeta, useIconFacetState } from "./useIconFacetState";
import { useIconSearch } from "./useIconSearch";

function FacetButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          "flex w-full items-center justify-between gap-2 py-0.5 pl-4 text-left text-sm transition before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full",
          active
            ? "font-medium text-sky-600 before:block before:bg-sky-500"
            : "text-slate-600 before:hidden before:bg-slate-300 hover:text-slate-900 hover:before:block",
        )}
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          {count}
        </span>
      </button>
    </li>
  );
}

export function IconFacetSidebar() {
  const { data } = useSchema();
  const { icons, prefixes } = useIconSearch(data?.presets ?? []);
  const [state, setState] = useIconFacetState();
  const meta = useIconFacetMeta(icons);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <SidebarSection title="Supplier">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.i_supplier === "all"}
            label="All suppliers"
            count={icons.length}
            onClick={() => setState({ i_supplier: "all" })}
          />
          {prefixes.map((prefix) => (
            <FacetButton
              key={prefix}
              active={state.i_supplier === prefix}
              label={prefix}
              count={meta.supplierCounts.get(prefix) ?? 0}
              onClick={() => setState({ i_supplier: prefix })}
            />
          ))}
        </ul>
      </SidebarSection>

      <SidebarSection title="Usage">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.i_usage === "all"}
            label="All"
            count={icons.length}
            onClick={() => setState({ i_usage: "all" })}
          />
          <FacetButton
            active={state.i_usage === "used"}
            label="Used by presets"
            count={meta.usedCount}
            onClick={() => setState({ i_usage: "used" })}
          />
          <FacetButton
            active={state.i_usage === "unused"}
            label="Unused"
            count={meta.unusedCount}
            onClick={() => setState({ i_usage: "unused" })}
          />
        </ul>
      </SidebarSection>

      <SidebarSection title="Asset status">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.i_hasSvg === "all"}
            label="All"
            count={icons.length}
            onClick={() => setState({ i_hasSvg: "all" })}
          />
          <FacetButton
            active={state.i_hasSvg === "with"}
            label="With SVG"
            count={meta.withSvg}
            onClick={() => setState({ i_hasSvg: "with" })}
          />
          <FacetButton
            active={state.i_hasSvg === "missing"}
            label="Missing SVG"
            count={meta.missingSvg}
            onClick={() => setState({ i_hasSvg: "missing" })}
          />
        </ul>
      </SidebarSection>

      <SidebarSection title="Sort">
        <select
          value={state.i_sort}
          onChange={(e) => setState({ i_sort: e.target.value as never })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          <option value="name">Name</option>
          <option value="usage_desc">Usage (high to low)</option>
          <option value="usage_asc">Usage (low to high)</option>
        </select>
      </SidebarSection>
    </div>
  );
}
