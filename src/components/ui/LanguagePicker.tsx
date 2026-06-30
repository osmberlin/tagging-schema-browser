import { useLocale } from '@/hooks/useLocale'

function ChevronDownIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Global comparison-language picker shown in the header (drives `locale` state). */
export function LanguagePicker() {
  const { locale, setLocale, locales } = useLocale()
  const valueLabel = locale || 'Choose'

  return (
    <div className="group relative h-10 w-[5.25rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-0.5 rounded-lg border border-slate-300 bg-white px-1.5 py-0.5 shadow-sm transition group-focus-within:border-sky-500 group-focus-within:ring-2 group-focus-within:ring-sky-500/30"
      >
        <span className="text-[10px] leading-none whitespace-nowrap text-slate-500">
          Compare Lang
        </span>
        <div className="flex min-w-0 items-center gap-0.5">
          <span className="min-w-0 flex-1 truncate text-xs leading-none font-medium text-slate-900">
            {valueLabel}
          </span>
          <ChevronDownIcon className="h-3 w-3 shrink-0 text-slate-400" />
        </div>
      </div>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label="Comparison language"
        title={locale ? `Compare with ${locale}` : 'Compare language (EN only)'}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0"
      >
<<<<<<< HEAD
        <option value="">Choose</option>
        {locales.map((l) => (
          <option key={l} value={l}>
            {l}
=======
        <option value="">EN only</option>
        {locales === null ? (
          <option value="" disabled>
            Loading…
>>>>>>> aecaf2c (Proxy full release schema on Netlify previews; fix locale discovery)
          </option>
        ) : (
          locales.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))
        )}
      </select>
    </div>
  )
}
