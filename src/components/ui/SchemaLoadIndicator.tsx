import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useSchema } from "@/contexts/SchemaContext";
import { useReferenceStore } from "@/stores/referenceStore";

/** Slim header hint while schema JSON is loading — does not block the reference toggle. */
export function SchemaLoadIndicator() {
  const { loading } = useSchema();
  const referencePreloading = useReferenceStore((s) => s.referencePreloading);
  if (!loading && !referencePreloading) return null;

  return (
    <div
      className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/90 px-4 py-1 text-xs text-slate-500 sm:px-6 lg:px-8"
      aria-live="polite"
    >
      <LoadingSpinner size="sm" />
      <span>{referencePreloading ? "Preparing schema…" : "Loading schema data…"}</span>
    </div>
  );
}
