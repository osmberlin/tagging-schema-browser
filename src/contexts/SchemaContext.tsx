import { ensureIconsForPresetUsage } from "@/components/PageIcons/iconRegistry";
import { buildPresetSearchIndex } from "@/components/PagePresets/presetSearch";
import type { References } from "@/schemaRuntimeDereference";
import { getCachedSchemaData, getSchemaLoadError, preloadSchemaData } from "@/utils/schemaCache";
import type { DenormalizedPreset, RawPresets, SchemaData } from "@/utils/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type SchemaContextValue = {
  dataUrl: string | null;
  setDataUrl: (url: string | null) => void;
  load: (url: string) => void;
  loading: boolean;
  error: string | null;
  data: SchemaData | null;
  presets: DenormalizedPreset[];
  presetsById: Map<string, DenormalizedPreset>;
  rawPresets: RawPresets;
  fields: SchemaData["fields"];
  fieldTranslations: SchemaData["fieldTranslations"];
  /** Reference map for runtime locale dereferencing; null when v7 dist or no refs. */
  schemaReferences: References | null;
};

const SchemaContext = createContext<SchemaContextValue | null>(null);

export function useSchema() {
  const ctx = useContext(SchemaContext);
  if (!ctx) throw new Error("useSchema must be used within SchemaProvider");
  return ctx;
}

export function SchemaProvider({
  children,
  dataUrl,
  setDataUrl,
}: {
  children: React.ReactNode;
  dataUrl: string | null;
  setDataUrl: (url: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SchemaData | null>(null);

  useEffect(() => {
    if (!dataUrl?.trim()) return;
    let cancelled = false;

    const cached = getCachedSchemaData(dataUrl);
    if (cached) {
      buildPresetSearchIndex(cached.presets);
      setData(cached);
      setError(null);
      setLoading(false);
      void ensureIconsForPresetUsage(cached.rawPresets);
      return;
    }

    setData(null);
    setLoading(true);
    setError(null);
    void preloadSchemaData(dataUrl)
      .then((schemaData) => {
        if (cancelled) return;
        if (!schemaData) {
          setError(getSchemaLoadError(dataUrl) ?? "Failed to load schema data");
          setData(null);
          setLoading(false);
          return;
        }
        buildPresetSearchIndex(schemaData.presets);
        setData(schemaData);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setData(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  const load = useCallback(
    (url: string) => {
      setDataUrl(url.trim() || null);
    },
    [setDataUrl],
  );

  const value = useMemo<SchemaContextValue>(
    () => ({
      dataUrl,
      setDataUrl: (url) => {
        setDataUrl(url);
        if (!url) setData(null);
        setError(null);
      },
      load,
      loading,
      error,
      data,
      presets: data?.presets ?? [],
      presetsById: data?.presetsById ?? new Map(),
      rawPresets: data?.rawPresets ?? {},
      fields: data?.fields ?? {},
      fieldTranslations: data?.fieldTranslations ?? {},
      schemaReferences: data?.schemaReferences ?? null,
    }),
    [dataUrl, setDataUrl, load, loading, error, data],
  );

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>;
}
