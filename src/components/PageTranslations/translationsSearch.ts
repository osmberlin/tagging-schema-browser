import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { z } from 'zod'
import { presetSearchSchema } from '@/components/PagePresets/useSearchState'

/** Translation-status filter for the selected locale (`""` = show all). */
export type TranslationStatus = '' | 'translated' | 'untranslated'

/**
 * The translations page reuses the presets search params (so the same faceted
 * sidebar + search bar work) and adds a translation-status filter. The compared
 * locale is global state (root `locale` param), not here.
 */
export const translationsSearchSchema = presetSearchSchema.extend({
  translation: z.enum(['', 'translated', 'untranslated']).catch(''),
})

export type TranslationsSearch = z.infer<typeof translationsSearchSchema>

export const translationsSearchDefaults: TranslationsSearch = translationsSearchSchema.parse({})

/** `[status, setStatus]` — selecting the active status again clears it (back to all). */
export function useTranslationStatus() {
  const value = useSearch({
    strict: false,
    select: (raw) => (raw.translation ?? '') as TranslationStatus,
  })
  const navigate = useNavigate()
  const set = useCallback(
    (next: TranslationStatus) => {
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, translation: next || undefined, page: 1 }),
        replace: true,
      })
    },
    [navigate],
  )
  return [value, set] as const
}
