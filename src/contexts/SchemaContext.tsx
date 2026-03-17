import { loadSchemaData } from "@/components/PagePresets/dataLoader";
import { denormalize } from "@/components/PagePresets/denormalize";
import { buildPresetSearchIndex } from "@/components/PagePresets/presetSearch";
import { DEFAULT_DATA_URL } from "@/utils/constants";
import type { DenormalizedPreset, SchemaData } from "@/utils/types";
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
};

const SchemaContext = createContext<SchemaContextValue | null>(null);

export function useSchema() {
  const ctx = useContext(SchemaContext);
  if (!ctx) throw new Error("useSchema must be used within SchemaProvider");
  return ctx;
}

const DEFAULT_CDN = DEFAULT_DATA_URL;

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
    setLoading(true);
    setError(null);
    loadSchemaData(dataUrl)
      .then((raw) => {
        if (cancelled) return;
        if (raw.loadErrors.length > 0) {
          setError(raw.loadErrors.join("; "));
          setLoading(false);
          return;
        }
        const diagnostics: string[] = [];
        const presets = denormalize(raw.presets, raw.translations, raw.categories, raw.fields);
        buildPresetSearchIndex(presets);
        const presetsById = new Map(presets.map((p) => [p.id, p]));
        const categoryNames: Record<string, string> = {};
        for (const [cid] of Object.entries(raw.categories)) {
          categoryNames[cid] = raw.translations.en?.presets?.categories?.[cid]?.name ?? cid;
        }
        setData({
          presets,
          presetsById,
          categories: raw.categories,
          categoryNames,
          loadError: null,
          diagnostics,
        });
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
    }),
    [dataUrl, setDataUrl, load, loading, error, data],
  );

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>;
}

export { DEFAULT_CDN };
