import { useLocale } from "@/contexts/LocaleContext";

/** Global comparison-language picker shown in the header (drives `locale` state). */
export function LanguagePicker() {
  const { locale, setLocale, locales } = useLocale();
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500" title="Comparison language">
      <span className="hidden lg:inline">Lang</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
      >
        <option value="">EN only</option>
        {locales.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
