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
      <div className="relative mt-2 pl-2">
        <div className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/10" />
        {buckets.map(({ key, doc_count }) => {
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={clsx(
                "relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-md py-1 pr-1 pl-4 text-left text-sm transition",
                isSelected
                  ? "bg-zinc-900/5 font-medium text-zinc-900 dark:bg-white/10 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              {isSelected ? (
                <span className="absolute left-2 h-4 w-px bg-emerald-500" aria-hidden="true" />
              ) : null}
              <span className="truncate">{key || "(empty)"}</span>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-2xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {doc_count}
              </span>
            </button>
          );
        })}
      </div>
    </SidebarSection>
  );
}

export function FacetSidebar() {
  const result = usePresetSearch();
  const [state, setState] = useSearchState();
  const orderRef = useRef<Record<string, string[]>>({});

  if (!result) {
    return (
      <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Facets appear after schema data is loaded.
      </div>
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
        title="Category"
        buckets={orderedBuckets("categoryNames", agg.categoryNames?.buckets ?? [])}
        selected={state.categoryNames}
        onToggle={(k) => toggle("categoryNames")(k)}
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
