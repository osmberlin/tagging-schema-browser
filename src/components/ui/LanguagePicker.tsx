import { useLocale } from '@/hooks/useLocale'
import { TRANSLATIONS_RELEASE_ONLY_MESSAGE } from '@/utils/translationsAvailability'

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
  const { translationsAvailable, locale, setLocale, locales } = useLocale()
  const valueLabel = locale || 'Choose'

  return (
    <div className="group relative h-10 w-[5.25rem]">
      {!translationsAvailable ? (
        <>
          <div
            className="absolute inset-0 z-20 cursor-not-allowed"
            aria-describedby="compare-lang-disabled-tip"
          />
          <div
            id="compare-lang-disabled-tip"
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-56 -translate-x-1/2 rounded-md bg-slate-900 px-2.5 py-2 text-[11px] leading-snug font-normal text-white shadow-lg group-focus-within:block group-hover:block"
          >
            {TRANSLATIONS_RELEASE_ONLY_MESSAGE}
            <span
              aria-hidden
              className="absolute top-full left-1/2 -mt-px -translate-x-1/2 border-4 border-transparent border-t-slate-900"
            />
          </div>
        </>
      ) : null}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex flex-col justify-center gap-0.5 rounded-lg border px-1.5 py-0.5 shadow-sm transition ${
          translationsAvailable
            ? 'border-slate-300 bg-white group-focus-within:border-sky-500 group-focus-within:ring-2 group-focus-within:ring-sky-500/30'
            : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
        }`}
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
        disabled={!translationsAvailable}
        aria-label="Comparison language"
        title={
          translationsAvailable
            ? locale
              ? `Compare with ${locale}`
              : 'Compare language (EN only)'
            : undefined
        }
        className={`absolute inset-0 z-10 h-full w-full appearance-none opacity-0 ${
          translationsAvailable ? 'cursor-pointer' : 'pointer-events-none cursor-not-allowed'
        }`}
      >
        <option value="">Choose</option>
        {locales.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
        {locale && !locales.includes(locale) ? <option value={locale}>{locale}</option> : null}
      </select>
    </div>
  )
}
