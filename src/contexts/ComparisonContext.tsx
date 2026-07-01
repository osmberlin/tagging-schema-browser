import { ensureIconsForPresetUsage } from "@/components/PageIcons/iconRegistry";
import { loadSchemaData } from "@/components/PagePresets/dataLoader";
import { denormalize } from "@/components/PagePresets/denormalize";
import {
  type SchemaReference,
  compareBaselineLabel,
  isCanonicalDataUrl,
  isReleaseCompareMode,
  resolveCompareBaselineUrl,
} from "@/utils/dataUrl";
import { type ComparisonResult, comparePresets } from "@/utils/presetDiff";
import { resolveReleaseVersion, resolveStagingUpdatedAt } from "@/utils/schemaVersion";
import type { DenormalizedPreset } from "@/utils/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSchema } from "./SchemaContext";

function ensureSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export type CompareMode = "preview" | "release";

type ComparisonContextValue = {
  /** Whether a custom build is being compared (PR preview or release-compare mode). */
  isComparing: boolean;
  /** How the active dataset relates to the comparison baseline. */
  compareMode: CompareMode | null;
  /** Resolved active data URL. */
  dataUrl: string;
  /** Hostname of the active data URL. */
  domain: string;
  /** Hostname of the comparison baseline (staging main or a PR preview). */
  compareDomain: string | null;
  /** Short label for the comparison baseline in UI copy. */
  compareLabel: string | null;
  /** Direct link to the active dataset's `presets.min.json`. */
  presetsUrl: string;
  /** Concrete release version string (e.g. "6.18.0"), once resolved. */
  releaseVersion: string | null;
  /** ISO timestamp of the latest commit on staging `main`, once resolved. */
  stagingUpdatedAt: string | null;
  /** Diff of the active dataset against the baseline (null on canonical datasets). */
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
  rawDataUrl,
  reference,
  activeDataUrl,
  children,
}: {
  /** Raw `dataUrl` search param (may hold a PR preview while release is active). */
  rawDataUrl: string;
  reference: SchemaReference;
  activeDataUrl: string;
  children: React.ReactNode;
}) {
  const { presets } = useSchema();
  const trimmedCompare = rawDataUrl.trim();
  const releaseCompareMode = isReleaseCompareMode(trimmedCompare, reference);
  const previewCompareMode =
    trimmedCompare.length > 0 && !isCanonicalDataUrl(trimmedCompare) && !releaseCompareMode;
  const isComparing = releaseCompareMode || previewCompareMode;
  const compareMode: CompareMode | null = releaseCompareMode
    ? "release"
    : previewCompareMode
      ? "preview"
      : null;
  const baselineUrl = resolveCompareBaselineUrl(trimmedCompare, reference);

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

  useEffect(() => {
    if (!baselineUrl) {
      setBaseline({ presets: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setBaseline({ presets: null, loading: true, error: null });
    loadSchemaData(baselineUrl)
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
  }, [baselineUrl]);

  const result = useMemo(
    () =>
      baseline.presets && presets.length > 0 ? comparePresets(baseline.presets, presets) : null,
    [baseline.presets, presets],
  );

  const value = useMemo<ComparisonContextValue>(() => {
    const compareDomain = baselineUrl ? hostnameFromUrl(baselineUrl) : null;
    const compareLabel = baselineUrl
      ? compareBaselineLabel(baselineUrl)
      : previewCompareMode
        ? "staging"
        : null;

    return {
      isComparing,
      compareMode,
      dataUrl: activeDataUrl,
      domain: hostnameFromUrl(activeDataUrl),
      compareDomain,
      compareLabel,
      presetsUrl: `${ensureSlash(activeDataUrl)}presets.min.json`,
      releaseVersion,
      stagingUpdatedAt,
      result,
      loading: baseline.loading,
      error: baseline.error,
    };
  }, [
    isComparing,
    compareMode,
    activeDataUrl,
    baselineUrl,
    previewCompareMode,
    releaseVersion,
    stagingUpdatedAt,
    result,
    baseline.loading,
    baseline.error,
  ]);

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}
