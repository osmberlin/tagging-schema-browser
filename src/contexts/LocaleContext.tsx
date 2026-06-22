import {
  type LocaleMap,
  useLocaleTranslations,
  useLocales,
} from "@/components/PageTranslations/useLocaleData";
import type { FieldTranslations } from "@/utils/types";
import { createContext, useContext, useMemo } from "react";

type LocaleContextValue = {
  /** Selected comparison locale ("" = none; English is always the reference). */
  locale: string;
  setLocale: (locale: string) => void;
  locales: string[];
  localeMap: LocaleMap | null;
  fieldLocaleMap: FieldTranslations | null;
  loading: boolean;
  error: string | null;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function LocaleProvider({
  dataUrl,
  locale,
  setLocale,
  children,
}: {
  dataUrl: string | null;
  locale: string;
  setLocale: (locale: string) => void;
  children: React.ReactNode;
}) {
  const locales = useLocales(dataUrl);
  const { map, fieldMap, loading, error } = useLocaleTranslations(dataUrl, locale);
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      locales,
      localeMap: map,
      fieldLocaleMap: fieldMap,
      loading,
      error,
    }),
    [locale, setLocale, locales, map, fieldMap, loading, error],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
