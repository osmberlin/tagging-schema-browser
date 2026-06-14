import { FacetSidebar } from "@/components/PagePresets/FacetSidebar";
import { searchPresets } from "@/components/PagePresets/presetSearch";
import { filtersFromState, useSearchState } from "@/components/PagePresets/useSearchState";
import { SidebarSection } from "@/components/ui/Sidebar";
import { useLocale } from "@/contexts/LocaleContext";
import { useSchema } from "@/contexts/SchemaContext";
import { clsx } from "clsx";
import { useMemo } from "react";
import { type TranslationStatus, useTranslationStatus } from "./translationsSearch";

type StatusOption = { value: Exclude<TranslationStatus, "">; label: string; count: number };

/** A single facet-style row (matches FacetSidebar's FacetGroup look). */
function StatusRow({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          "flex w-full items-center justify-between gap-2 py-0.5 pl-4 text-left text-sm transition before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full",
          selected
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

/** Translations sidebar: the translation-status filter first, then the shared facets. */
export function TranslationsSidebar() {
  const [status, setStatus] = useTranslationStatus();
  const { locale, localeMap } = useLocale();
  const { data } = useSchema();
  const [state] = useSearchState();

  // Status breakdown of the current facet selection (same `matched` set the page uses).
  // `data` is a dep so the counts recompute once the search index is built.
  const counts = useMemo(() => {
    if (!data) return { translated: 0, untranslated: 0 };
    const res = searchPresets({
      query: "",
      filters: filtersFromState(state),
      page: 1,
      per_page: 100000,
      sort: state.sort,
    });
    const matched = (res?.data.items ?? []).filter((p) => p.name && p.searchable !== false);
    const translated = localeMap ? matched.filter((p) => localeMap.get(p.id)?.name).length : 0;
    return { translated, untranslated: matched.length - translated };
  }, [data, state, localeMap]);

  const options: StatusOption[] = [
    { value: "translated", label: "Translated", count: counts.translated },
    { value: "untranslated", label: "Untranslated", count: counts.untranslated },
  ];

  return (
    <div className="flex flex-col">
      {locale ? (
        <SidebarSection title="Translation status" className="mt-6">
          <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
            {options.map((o) => (
              <StatusRow
                key={o.value}
                label={o.label}
                count={o.count}
                selected={status === o.value}
                // Re-selecting the active status clears it (back to all).
                onClick={() => setStatus(status === o.value ? "" : o.value)}
              />
            ))}
          </ul>
        </SidebarSection>
      ) : null}
      <FacetSidebar />
    </div>
  );
}
