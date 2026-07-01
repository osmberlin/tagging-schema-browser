import { ensureIconsForPresetUsage } from "@/components/PageIcons/iconRegistry";
import { loadSchemaData } from "@/components/PagePresets/dataLoader";
import { denormalize } from "@/components/PagePresets/denormalize";
import { INTEREM_DATA_URL } from "@/utils/constants";
import { isCanonicalDataUrl } from "@/utils/dataUrl";
import { type ComparisonResult, comparePresets } from "@/utils/presetDiff";
import { resolveReleaseVersion, resolveStagingUpdatedAt } from "@/utils/schemaVersion";
import type { DenormalizedPreset } from "@/utils/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSchema } from "./SchemaContext";

function ensureSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

type ComparisonContextValue = {
  /** Whether the active dataset is a custom build (PR preview) being compared. */
  isComparing: boolean;
  /** Resolved active data URL. */
  dataUrl: string;
  /** Hostname of the active data URL (identifies a PR preview build). */
  domain: string;
  /** Direct link to the active dataset's `presets.min.json`. */
  presetsUrl: string;
  /** Concrete release version string (e.g. "6.18.0"), once resolved. */
  releaseVersion: string | null;
  /** ISO timestamp of the latest commit on staging `main`, once resolved. */
  stagingUpdatedAt: string | null;
  /** Diff of the active dataset against staging (null on canonical datasets). */
  result: ComparisonResult | null;
  loading: boolean;
  error: string | null;
};

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison must be used within ComparisonProvider");
  return ctx;
}

export function ComparisonProvider({
  dataUrl,
  children,
}: {
  dataUrl: string;
  children: React.ReactNode;
}) {
  const { presets } = useSchema();
  const isComparing = !isCanonicalDataUrl(dataUrl);
  const [releaseVersion, setReleaseVersion] = useState<string | null>(null);
  const [stagingUpdatedAt, setStagingUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void resolveReleaseVersion().then((v) => {
      if (!cancelled) setReleaseVersion(v);
    });
    void resolveStagingUpdatedAt().then((v) => {
      if (!cancelled) setStagingUpdatedAt(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [baseline, setBaseline] = useState<{
    presets: DenormalizedPreset[] | null;
    loading: boolean;
    error: string | null;
  }>({ presets: null, loading: false, error: null });

  // Load interem in the background only when viewing a custom PR preview build.
  useEffect(() => {
    if (!isComparing) {
      setBaseline({ presets: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setBaseline({ presets: null, loading: true, error: null });
    loadSchemaData(INTEREM_DATA_URL)
      .then(async (raw) => {
        if (cancelled) return;
        if (raw.loadErrors.length > 0) {
          setBaseline({ presets: null, loading: false, error: raw.loadErrors.join("; ") });
          return;
        }
        const denorm = denormalize(raw.presets, raw.translations, raw.categories, raw.fields);
        setBaseline({ presets: denorm, loading: false, error: null });
        void ensureIconsForPresetUsage(raw.presets);
      })
      .catch((e) => {
        if (!cancelled) {
          setBaseline({
            presets: null,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isComparing]);

  const result = useMemo(
    () =>
      baseline.presets && presets.length > 0 ? comparePresets(baseline.presets, presets) : null,
    [baseline.presets, presets],
  );

  const value = useMemo<ComparisonContextValue>(() => {
    let domain = "";
    try {
      domain = new URL(dataUrl).hostname;
    } catch {
      domain = dataUrl;
    }
    return {
      isComparing,
      dataUrl,
      domain,
      presetsUrl: `${ensureSlash(dataUrl)}presets.min.json`,
      releaseVersion,
      stagingUpdatedAt,
      result,
      loading: baseline.loading,
      error: baseline.error,
    };
  }, [
    isComparing,
    dataUrl,
    releaseVersion,
    stagingUpdatedAt,
    result,
    baseline.loading,
    baseline.error,
  ]);

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}
