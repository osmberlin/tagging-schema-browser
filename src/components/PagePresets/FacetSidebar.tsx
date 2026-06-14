import { SidebarSection } from "@/components/ui/Sidebar";
import { clsx } from "clsx";
import { useRef, useState } from "react";
import { usePresetSearch } from "./usePresetSearch";
import { useSearchState } from "./useSearchState";

type Bucket = { key: string; doc_count: number };

function FacetGroup({
  title,
  buckets,
  selected,
  onToggle,
}: {
  title: string;
  buckets: Bucket[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  // Hide the no-result options by default so the list stays short.
  const [showEmpty, setShowEmpty] = useState(false);
  if (!buckets?.length) return null;
  const hiddenCount = buckets.filter((b) => b.doc_count === 0 && !selected.includes(b.key)).length;
  const visible = showEmpty
    ? buckets
    : buckets.filter((b) => b.doc_count > 0 || selected.includes(b.key));
  return (
    <SidebarSection title={title}>
      <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
        {visible.map(({ key, doc_count }) => {
          const isSelected = selected.includes(key);
          // Adding this facet would yield no results — disable it.
          const disabled = doc_count === 0 && !isSelected;
          return (
            <li key={key} className="relative">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(key)}
                className={clsx(
                  "flex w-full items-center justify-between gap-2 py-0.5 pl-4 text-left text-sm transition before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full",
                  isSelected
                    ? "font-medium text-sky-600 before:block before:bg-sky-500"
                    : disabled
                      ? "text-slate-300 before:hidden"
                      : "text-slate-600 before:hidden before:bg-slate-300 hover:text-slate-900 hover:before:block",
                )}
              >
                <span className="truncate">{key || "(empty)"}</span>
                <span
                  className={clsx(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    disabled ? "bg-slate-50 text-slate-300" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {doc_count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowEmpty((v) => !v)}
          className="mt-1 pl-4 text-left text-xs font-medium text-sky-600 hover:underline"
        >
          {showEmpty ? "Hide empty" : `Show ${hiddenCount} with no results`}
        </button>
      ) : null}
    </SidebarSection>
  );
}

export function FacetSidebar() {
  const result = usePresetSearch();
  const [state, setState] = useSearchState();
  const orderRef = useRef<Record<string, string[]>>({});

  if (!result) {
    return (
      <div className="mt-4 text-sm text-slate-500 ">Facets appear after schema data is loaded.</div>
    );
  }

  const agg = result.aggregations ?? {};
  // Keep a stable order of every bucket ever seen, and re-include ones that have
  // dropped to 0 under the current filters (with doc_count 0) so they render as
  // disabled rather than disappearing.
  const orderedBuckets = (facetKey: string, buckets: Bucket[]): Bucket[] => {
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    const known = new Set(orderRef.current[facetKey] ?? []);
    const order = [...(orderRef.current[facetKey] ?? [])];
    for (const bucket of buckets) {
      if (!known.has(bucket.key)) {
        order.push(bucket.key);
        known.add(bucket.key);
      }
    }
    orderRef.current[facetKey] = order;
    return order.map((key) => bucketMap.get(key) ?? { key, doc_count: 0 });
  };

  const toggle = (facet: keyof typeof state) => (key: string) => {
    const arr = state[facet] as string[];
    const next = arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key];
    setState({ [facet]: next, page: 1 });
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      <FacetGroup
        title="Category"
        buckets={orderedBuckets("categoryFacet", agg.categoryFacet?.buckets ?? [])}
        selected={state.categoryNames}
        onToggle={(k) => toggle("categoryNames")(k)}
      />
      <FacetGroup
        title="Primary tag"
        buckets={orderedBuckets("primaryTagKey", agg.primaryTagKey?.buckets ?? [])}
        selected={state.primaryTagKey}
        onToggle={(k) => toggle("primaryTagKey")(k)}
      />
      <FacetGroup
        title="Geometry"
        buckets={orderedBuckets("geometry", agg.geometry?.buckets ?? [])}
        selected={state.geometry}
        onToggle={(k) => toggle("geometry")(k)}
      />
      <FacetGroup
        title="Icon set"
        buckets={orderedBuckets("iconPrefix", agg.iconPrefix?.buckets ?? [])}
        selected={state.iconPrefix}
        onToggle={(k) => toggle("iconPrefix")(k)}
      />
      <FacetGroup
        title="Fields"
        buckets={orderedBuckets("fieldIds", agg.fieldIds?.buckets ?? [])}
        selected={state.fieldIds}
        onToggle={(k) => toggle("fieldIds")(k)}
      />
      <FacetGroup
        title="Has icon"
        buckets={orderedBuckets("hasIcon", agg.hasIcon?.buckets ?? [])}
        selected={state.hasIcon}
        onToggle={(k) => toggle("hasIcon")(k)}
      />
    </div>
  );
}
