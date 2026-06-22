import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { searchPresets } from "@/components/PagePresets/presetSearch";
import {
  filtersFromState,
  useSearchState,
  useSetPreset,
} from "@/components/PagePresets/useSearchState";
import { CountPill } from "@/components/ui/CountPill";
import { useLocale } from "@/contexts/LocaleContext";
import { useSchema } from "@/contexts/SchemaContext";
import type { DenormalizedPreset } from "@/utils/types";
import { clsx } from "clsx";
import { useMemo } from "react";
import { useTranslationStatus } from "./translationsSearch";

const PER_PAGE = 50;

/** Google Translate deep link (no API). Strip the region for the target except for zh. */
function gtUrl(locale: string, text: string): string {
  const tl = locale.startsWith("zh") ? locale : locale.split("-")[0] || locale;
  return `https://translate.google.com/?sl=en&tl=${encodeURIComponent(tl)}&text=${encodeURIComponent(text)}&op=translate`;
}

function TermChips({ terms, shared }: { terms: string[]; shared: Set<string> }) {
  if (!terms.length) return <span className="text-slate-300">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {terms.map((t) => (
        <span
          key={t}
          className={clsx(
            "rounded-full px-2 py-0.5 text-xs",
            shared.has(t)
              ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100 ring-inset"
              : "bg-slate-100 text-slate-600",
          )}
          title={shared.has(t) ? "Identical in both languages" : undefined}
        >
          {t}
        </span>
      ))}
    </span>
  );
}

/** One labelled row inside a preset entry: subheadline + English + locale columns. */
function AttrRow({
  label,
  english,
  localized,
  showLocale,
}: {
  label: string;
  english: React.ReactNode;
  localized?: React.ReactNode;
  showLocale: boolean;
}) {
  return (
    <div
      className={clsx(
        "grid items-start gap-x-4 gap-y-1 border-t border-slate-100 px-3 py-2",
        showLocale ? "grid-cols-[5rem_1fr] sm:grid-cols-[6rem_1fr_1fr]" : "grid-cols-[5rem_1fr]",
      )}
    >
      <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</div>
      <div className="min-w-0 text-sm text-slate-900 sm:col-start-2">{english}</div>
      {showLocale ? (
        <div className="col-start-2 min-w-0 text-sm text-slate-900 sm:col-start-3">{localized}</div>
      ) : null}
    </div>
  );
}

export function PageTranslations() {
  const { data, dataUrl } = useSchema();
  const [state, setState] = useSearchState();
  const [translationStatus] = useTranslationStatus();
  const setPreset = useSetPreset();
  const { locale, localeMap, loading, error } = useLocale();

  const filters = useMemo(() => filtersFromState(state), [state]);

  // Facet-filter via itemsjs (so the shared sidebar applies), but run the text
  // query ourselves so it can match the locale's content too (bilingual search).
  const matched = useMemo(() => {
    if (!data) return [] as DenormalizedPreset[];
    const res = searchPresets({ query: "", filters, page: 1, per_page: 100000, sort: state.sort });
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

  if (!dataUrl && !data) {
    return <p className="text-sm text-slate-500">Load schema data from the Presets page first.</p>;
  }

  const showLocale = Boolean(locale);
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(state.page, totalPages);
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          Translations <CountPill className="text-sm">{rows.length}</CountPill>
        </h1>
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
              const enTermSet = new Set(p.terms);
              const locTermSet = new Set(loc?.terms ?? []);
              const untranslated = showLocale && !loc?.name;
              const sameName = Boolean(loc?.name && loc.name === p.name);
              return (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className="group/ac relative flex w-full items-start justify-between gap-3 bg-slate-50/70 px-3 py-2 pr-9 text-left transition hover:bg-sky-50"
                    title="Show details of preset"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <PresetIconBox preset={p} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-900 group-hover/ac:text-sky-700">
                          {p.name}
                        </span>
                        <span className="block font-mono text-[11px] text-slate-400">{p.id}</span>
                      </span>
                    </span>
                    {untranslated ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
                        untranslated
                      </span>
                    ) : null}
                    <span
                      aria-hidden
                      className="absolute top-1/2 right-2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 group-hover/ac:flex"
                    >
                      ›
                    </span>
                  </button>

                  {/* Header row labelling the two compared columns; GT translates the English source. */}
                  {showLocale ? (
                    <div className="grid grid-cols-[5rem_1fr] gap-x-4 px-3 pt-2 text-[11px] font-medium text-slate-400 sm:grid-cols-[6rem_1fr_1fr]">
                      <div />
                      <div className="flex items-center gap-2 sm:col-start-2">
                        <span>English</span>
                        <a
                          href={gtUrl(
                            locale,
                            [p.name, ...p.terms, ...p.aliases].filter(Boolean).join("\n"),
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sky-600 hover:underline"
                          title="Translate the English name, terms & aliases (one per line) via Google Translate"
                        >
                          GT ↗
                        </a>
                      </div>
                      <div className="col-start-2 font-mono sm:col-start-3">{locale}</div>
                    </div>
                  ) : null}

                  <AttrRow
                    label="Name"
                    showLocale={showLocale}
                    english={<span>{p.name}</span>}
                    localized={
                      untranslated ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span
                          className={clsx(sameName && "text-amber-700")}
                          title={sameName ? "Same as English" : undefined}
                        >
                          {loc?.name}
                        </span>
                      )
                    }
                  />
                  <AttrRow
                    label="Terms"
                    showLocale={showLocale}
                    english={<TermChips terms={p.terms} shared={locTermSet} />}
                    localized={<TermChips terms={loc?.terms ?? []} shared={enTermSet} />}
                  />
                  {p.aliases.length || loc?.aliases.length ? (
                    <AttrRow
                      label="Aliases"
                      showLocale={showLocale}
                      english={
                        p.aliases.length ? (
                          <span className="text-slate-600">{p.aliases.join(", ")}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )
                      }
                      localized={
                        loc?.aliases.length ? (
                          <span className="text-slate-600">{loc.aliases.join(", ")}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )
                      }
                    />
                  ) : null}
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
