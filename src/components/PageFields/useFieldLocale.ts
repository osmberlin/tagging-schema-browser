import { useSchema } from "@/contexts/SchemaContext";
import type { RawFieldTranslation } from "@/utils/types";
import { useEffect, useState } from "react";

function ensureSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

async function loadFieldLocale(
  dataUrl: string,
  locale: string,
  fieldId: string,
): Promise<RawFieldTranslation | undefined> {
  const res = await fetch(`${ensureSlash(dataUrl)}translations/${locale}.min.json`);
  if (!res.ok) throw new Error(`No translations for "${locale}" (HTTP ${res.status})`);
  const json = (await res.json()) as Record<
    string,
    { presets?: { fields?: Record<string, RawFieldTranslation> } }
  >;
  return json[locale]?.presets?.fields?.[fieldId];
}

export function useFieldLocale(locale: string, fieldId: string) {
  const { dataUrl } = useSchema();
  const [state, setState] = useState<{
    fieldLocale: RawFieldTranslation | undefined;
    loading: boolean;
    error: string | null;
  }>({ fieldLocale: undefined, loading: false, error: null });

  useEffect(() => {
    if (!dataUrl || !locale || !fieldId) {
      setState({ fieldLocale: undefined, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ fieldLocale: undefined, loading: true, error: null });
    loadFieldLocale(dataUrl, locale, fieldId)
      .then((fieldLocale) => {
        if (!cancelled) setState({ fieldLocale, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) {
          setState({
            fieldLocale: undefined,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl, locale, fieldId]);

  return state;
}
