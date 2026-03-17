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
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-md py-1 pr-1 pl-4 text-left text-sm transition",
        active
          ? "bg-zinc-900/5 font-medium text-zinc-900 dark:bg-white/10 dark:text-white"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
      )}
    >
      {active ? (
        <span className="absolute left-2 h-4 w-px bg-emerald-500" aria-hidden="true" />
      ) : null}
      <span className="truncate">{label}</span>
      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-2xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {count}
      </span>
    </button>
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
        <div className="relative mt-2 pl-2">
          <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/10" />
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
        </div>
      </SidebarSection>

      <SidebarSection title="Usage">
        <div className="relative mt-2 pl-2">
          <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/10" />
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
        </div>
      </SidebarSection>

      <SidebarSection title="Asset status">
        <div className="relative mt-2 pl-2">
          <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/10" />
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
        </div>
      </SidebarSection>

      <SidebarSection title="Sort">
        <select
          value={state.i_sort}
          onChange={(e) => setState({ i_sort: e.target.value as never })}
          className="w-full rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="name">Name</option>
          <option value="usage_desc">Usage (high to low)</option>
          <option value="usage_asc">Usage (low to high)</option>
        </select>
      </SidebarSection>
    </div>
  );
}
