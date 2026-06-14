import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { useSchema } from "@/contexts/SchemaContext";
import { clsx } from "clsx";
import { useMemo } from "react";
import { useTranslationsSearch } from "./translationsSearch";
import { useLocaleTranslations, useLocales } from "./useLocaleData";

const PER_PAGE = 50;

/** Google Translate deep link (no API). Strip the region for the target except for zh. */
function gtUrl(locale: string, text: string): string {
  const tl = locale.startsWith("zh") ? locale : locale.split("-")[0] || locale;
  return `https://translate.google.com/?sl=en&tl=${encodeURIComponent(tl)}&text=${encodeURIComponent(text)}&op=translate`;
}

function Terms({ terms, shared }: { terms: string[]; shared: Set<string> }) {
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

export function PageTranslations() {
  const { data, dataUrl, presets } = useSchema();
  const [state, setState] = useTranslationsSearch();
  const locales = useLocales(dataUrl);
  const { map: localeMap, loading, error } = useLocaleTranslations(dataUrl, state.locale);

  const allRows = useMemo(
    () =>
      presets
        .filter((p) => p.name && p.searchable !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [presets],
  );

  const q = state.q.trim().toLowerCase();
  const filtered = useMemo(() => {
    let rows = allRows;
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.terms.some((t) => t.includes(q)),
      );
    }
    if (state.untranslated && localeMap) rows = rows.filter((p) => !localeMap.get(p.id)?.name);
    return rows;
  }, [allRows, q, state.untranslated, localeMap]);

  const translatedCount = useMemo(
    () => (localeMap ? allRows.filter((p) => localeMap.get(p.id)?.name).length : 0),
    [allRows, localeMap],
  );

  if (!dataUrl && !data) {
    return <p className="text-sm text-slate-500">Load schema data from the Presets page first.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(state.page, totalPages);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const controlClass =
    "h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Translations</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={state.q}
            onChange={(e) => setState({ q: e.target.value, page: 1 })}
            placeholder="Filter presets…"
            className={clsx(controlClass, "w-44")}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={state.untranslated}
              onChange={(e) => setState({ untranslated: e.target.checked, page: 1 })}
            />
            Untranslated only
          </label>
          <select
            value={state.locale}
            onChange={(e) => setState({ locale: e.target.value, page: 1 })}
            className={clsx(controlClass, "py-0")}
          >
            <option value="">Compare language…</option>
            {locales.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        English (incl. en-GB) is the reference.{" "}
        {state.locale ? (
          <>
            Comparing <strong className="font-mono text-slate-700">{state.locale}</strong>
            {localeMap ? (
              <>
                {" "}
                — {translatedCount} of {allRows.length} presets translated
              </>
            ) : null}
            . Sky-highlighted terms are identical in both languages.
          </>
        ) : (
          "Pick a language to compare its search terms against English."
        )}
      </p>

      {!state.locale ? null : loading ? (
        <p className="text-sm text-slate-500">Loading {state.locale}…</p>
      ) : error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {["Preset", "English (reference)", state.locale].map((label) => (
                    <th
                      key={label}
                      className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => {
                  const loc = localeMap?.get(p.id);
                  const enTermSet = new Set(p.terms);
                  const locTermSet = new Set(loc?.terms ?? []);
                  const untranslated = !loc?.name;
                  const sameName = Boolean(loc?.name && loc.name === p.name);
                  return (
                    <tr key={p.id} className="align-top hover:bg-slate-50/60">
                      <td className="w-1/4 border-b border-slate-100 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <PresetIconBox preset={p} size="sm" />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900">{p.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <div className="text-slate-900">{p.name}</div>
                        <div className="mt-1">
                          <Terms terms={p.terms} shared={locTermSet} />
                        </div>
                        {p.aliases.length ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Aliases: {p.aliases.join(", ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          {untranslated ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
                              untranslated
                            </span>
                          ) : (
                            <span
                              className={clsx("text-slate-900", sameName && "text-amber-700")}
                              title={sameName ? "Same as English" : undefined}
                            >
                              {loc?.name}
                            </span>
                          )}
                          <a
                            href={gtUrl(state.locale, [p.name, ...p.terms].join(", "))}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-xs font-medium text-sky-600 hover:underline"
                            title="Open the English name + terms in Google Translate"
                          >
                            GT ↗
                          </a>
                        </div>
                        <div className="mt-1">
                          <Terms terms={loc?.terms ?? []} shared={enTermSet} />
                        </div>
                        {loc?.aliases.length ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Aliases: {loc.aliases.join(", ")}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {filtered.length} preset{filtered.length !== 1 ? "s" : ""}
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
        </>
      )}
    </div>
  );
}
