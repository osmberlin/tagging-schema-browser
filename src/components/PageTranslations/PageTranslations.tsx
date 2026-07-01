import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { PresetTranslationTable } from "@/components/PagePresets/PresetTranslationTable";
import { PRESET_SEARCH_ALL, searchPresets } from "@/components/PagePresets/presetSearch";
import { filtersFromState, useSearchState } from "@/components/PagePresets/useSearchState";
import { CountPill } from "@/components/ui/CountPill";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { AreaIcon } from "@/components/ui/areaIcons";
import { useLocale } from "@/contexts/LocaleContext";
import { useSchema } from "@/contexts/SchemaContext";
import { areaAccent } from "@/theme/areaAccent";
import { exportTranslations } from "@/utils/pageExports";
import type { DenormalizedPreset } from "@/utils/types";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslationStatus } from "./translationsSearch";

const PER_PAGE = 50;

export function PageTranslations() {
  const { data, dataUrl } = useSchema();
  const [state, setState] = useSearchState();
  const [translationStatus] = useTranslationStatus();
  const { locale, localeMap, loading, error } = useLocale();

  const filters = useMemo(() => filtersFromState(state), [state]);

  // Facet-filter via itemsjs (so the shared sidebar applies), but run the text
  // query ourselves so it can match the locale's content too (bilingual search).
  const matched = useMemo(() => {
    if (!data) return [] as DenormalizedPreset[];
    const res = searchPresets({
      query: "",
      filters,
      page: 1,
      per_page: PRESET_SEARCH_ALL,
      sort: state.sort,
    });
    return (res?.data.items ?? []).filter((p) => p.name && p.searchable !== false);
  }, [data, filters, state.sort]);

  const q = state.q.trim().toLowerCase();
  const rows = useMemo(() => {
    let r = matched;
    if (q) {
      r = r.filter((p) => {
        const loc = localeMap?.get(p.id);
        const haystack = [
          p.name,
          p.id,
          ...p.terms,
          ...p.aliases,
          loc?.name ?? "",
          ...(loc?.terms ?? []),
          ...(loc?.aliases ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    if (translationStatus && localeMap) {
      r = r.filter((p) => {
        const translated = Boolean(localeMap.get(p.id)?.name);
        return translationStatus === "translated" ? translated : !translated;
      });
    }
    return r;
  }, [matched, q, translationStatus, localeMap]);

  const translatedCount = useMemo(
    () => (localeMap ? matched.filter((p) => localeMap.get(p.id)?.name).length : 0),
    [matched, localeMap],
  );
  const exportData = useMemo(
    () => exportTranslations(rows, locale || undefined, localeMap),
    [rows, locale, localeMap],
  );
  const exportFilename = locale ? `translations-${locale}.json` : "translations.json";
  const showLocale = Boolean(locale);
  const canExportTranslations = exportData.length > 0 && (!showLocale || (!loading && !error && localeMap));

  if (!dataUrl && !data) {
    return <p className="text-sm text-slate-500">Load schema data from the Presets page first.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(state.page, totalPages);
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
            <AreaIcon area="translations" className={`h-7 w-7 ${areaAccent.translations.icon}`} />
            Translations <CountPill className="text-sm">{rows.length}</CountPill>
          </h1>
          <DownloadButton
            filename={exportFilename}
            data={exportData}
            disabled={exportData.length === 0}
          />
        </div>
        <p className="text-sm text-slate-500">
          {showLocale ? (
            <>
              Comparing the preset's English source with{" "}
              <strong className="font-mono text-slate-700">{locale}</strong>
              {localeMap ? (
                <>
                  {" "}
                  — {translatedCount} of {matched.length} translated
                </>
              ) : null}
              .
            </>
          ) : (
            "Pick a language in the top bar to compare it against the preset's English source."
          )}
        </p>
      </div>

      {showLocale && loading ? (
        <p className="text-sm text-slate-500">Loading {locale}…</p>
      ) : showLocale && error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {pageRows.map((p) => {
              const loc = localeMap?.get(p.id);
              const untranslated = showLocale && !loc?.name;
              return (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <Link
                    to="/preset/$"
                    params={{ _splat: p.id }}
                    search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
                    className={`group/ac relative flex w-full items-start justify-between gap-3 bg-slate-50/70 px-3 py-2 pr-9 text-left transition ${areaAccent.translations.rowHover}`}
                    title="Show details of preset"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <PresetIconBox preset={p} size="sm" />
                      <span className="min-w-0">
                        <span
                          className={`block font-medium text-slate-900 ${areaAccent.translations.rowHoverText}`}
                        >
                          {p.name}
                        </span>
                        <span className="block font-mono text-[11px] text-slate-400">{p.id}</span>
                      </span>
                    </span>
                    {untranslated ? (
                      <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-100 ring-inset">
                        untranslated
                      </span>
                    ) : null}
                    <span
                      aria-hidden
                      className={`absolute top-1/2 right-2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-sm font-semibold group-hover/ac:flex ${areaAccent.translations.cardChevron}`}
                    >
                      ›
                    </span>
                  </Link>

                  <PresetTranslationTable
                    preset={p}
                    locale={locale}
                    localized={
                      loc ? { name: loc.name, terms: loc.terms, aliases: loc.aliases } : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>

          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No presets match the current filters.
            </p>
          ) : null}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                {rows.length} preset{rows.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setState({ page: page - 1 })}
                  className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setState({ page: page + 1 })}
                  className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
