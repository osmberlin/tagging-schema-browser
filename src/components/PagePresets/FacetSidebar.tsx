import { SidebarSection } from "@/components/ui/Sidebar";
import { clsx } from "clsx";
import { useRef } from "react";
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
  if (!buckets?.length) return null;
  return (
    <SidebarSection title={title}>
      <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
        {buckets.map(({ key, doc_count }) => {
          const isSelected = selected.includes(key);
          return (
            <li key={key} className="relative">
              <button
                type="button"
                onClick={() => onToggle(key)}
                className={clsx(
                  "flex w-full items-center justify-between gap-2 py-0.5 pl-4 text-left text-sm transition before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full",
                  isSelected
                    ? "font-medium text-sky-600 before:block before:bg-sky-500"
                    : "text-slate-600 before:hidden before:bg-slate-300 hover:text-slate-900 hover:before:block",
                )}
              >
                <span className="truncate">{key || "(empty)"}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {doc_count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
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
  const orderedBuckets = (facetKey: string, buckets: Bucket[]) => {
    const existing = orderRef.current[facetKey];
    if (!existing || existing.length === 0) {
      orderRef.current[facetKey] = buckets.map((bucket) => bucket.key);
      return buckets;
    }

    const known = new Set(existing);
    const nextOrder = [...existing];
    for (const bucket of buckets) {
      if (!known.has(bucket.key)) {
        nextOrder.push(bucket.key);
        known.add(bucket.key);
      }
    }
    orderRef.current[facetKey] = nextOrder;

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    return nextOrder
      .map((key) => bucketMap.get(key))
      .filter((bucket): bucket is Bucket => Boolean(bucket));
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
