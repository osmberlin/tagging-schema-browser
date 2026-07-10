import { Link } from '@tanstack/react-router'
import { areaAccent } from '@/theme/areaAccent'
import { TRANSLATIONS_RELEASE_ONLY_MESSAGE } from '@/utils/translationsAvailability'

/** Shown when comparison locales are unavailable (staging / PR preview dist). */
export function TranslationsReleaseCallout() {
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="note"
    >
      <p>{TRANSLATIONS_RELEASE_ONLY_MESSAGE}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          to="."
          search={(prev) => ({
            ...prev,
            reference: 'release',
            dataUrl: undefined,
          })}
          className={`font-medium underline-offset-2 hover:underline ${areaAccent.translations.icon}`}
        >
          Switch to Release →
        </Link>
        <Link
          to="/about"
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          className="text-amber-900/80 underline-offset-2 hover:text-amber-950 hover:underline"
        >
          About: pinned release URL
        </Link>
      </p>
    </div>
  )
}
