import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

/** Search params for the translations page (route "/translations"). */
export const translationsSearchSchema = z.object({
  /** Locale to compare against English, e.g. "de". Empty = none selected. */
  locale: z.string().catch(""),
  q: z.string().catch(""),
  /** Show only presets the locale hasn't translated. */
  untranslated: z.boolean().catch(false),
  page: z.number().int().positive().catch(1),
});

export type TranslationsSearch = z.infer<typeof translationsSearchSchema>;

export const translationsSearchDefaults: TranslationsSearch = translationsSearchSchema.parse({});

export function useTranslationsSearch() {
  const state = useSearch({ strict: false, select: (raw) => translationsSearchSchema.parse(raw) });
  const navigate = useNavigate();
  const setState = useCallback(
    (patch: Partial<TranslationsSearch>) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true });
    },
    [navigate],
  );
  return [state, setState] as const;
}
