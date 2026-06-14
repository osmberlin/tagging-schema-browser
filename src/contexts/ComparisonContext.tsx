import { loadSchemaData } from "@/components/PagePresets/dataLoader";
import { denormalize } from "@/components/PagePresets/denormalize";
import { DEFAULT_DATA_URL } from "@/utils/constants";
import { type ComparisonResult, comparePresets } from "@/utils/presetDiff";
import type { DenormalizedPreset } from "@/utils/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSchema } from "./SchemaContext";

function ensureSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

/** True when the active data URL is the published release (the default CDN base). */
function isReleaseUrl(url: string): boolean {
  return ensureSlash(url) === ensureSlash(DEFAULT_DATA_URL);
}

/** Resolve the concrete release version behind the `@latest` default (jsDelivr). */
function useReleaseVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(
      "https://data.jsdelivr.com/v1/packages/npm/@openstreetmap/id-tagging-schema/resolved?specifier=latest",
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { version?: string } | null) => {
        if (!cancelled && j?.version) setVersion(j.version);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return version;
}

type ComparisonContextValue = {
  /** Whether the active dataset is the published release. */
  isRelease: boolean;
  /** Resolved active data URL. */
  dataUrl: string;
  /** Hostname of the active data URL (identifies a PR preview build). */
  domain: string;
  /** Direct link to the active dataset's `presets.min.json`. */
  presetsUrl: string;
  /** Concrete release version string (e.g. "6.12.0"), once resolved. */
  releaseVersion: string | null;
  /** Diff of the active dataset against the release (null on the release itself). */
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
  const isRelease = isReleaseUrl(dataUrl);
  const releaseVersion = useReleaseVersion();

  const [release, setRelease] = useState<{
    presets: DenormalizedPreset[] | null;
    loading: boolean;
    error: string | null;
  }>({ presets: null, loading: false, error: null });

  // Load the release dataset in the background only when viewing a custom build.
  useEffect(() => {
    if (isRelease) {
      setRelease({ presets: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setRelease({ presets: null, loading: true, error: null });
    loadSchemaData(DEFAULT_DATA_URL)
      .then((raw) => {
        if (cancelled) return;
        if (raw.loadErrors.length > 0) {
          setRelease({ presets: null, loading: false, error: raw.loadErrors.join("; ") });
          return;
        }
        const denorm = denormalize(raw.presets, raw.translations, raw.categories, raw.fields);
        setRelease({ presets: denorm, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) {
          setRelease({
            presets: null,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isRelease]);

  const result = useMemo(
    () => (release.presets && presets.length > 0 ? comparePresets(release.presets, presets) : null),
    [release.presets, presets],
  );

  const value = useMemo<ComparisonContextValue>(() => {
    let domain = "";
    try {
      domain = new URL(dataUrl).hostname;
    } catch {
      domain = dataUrl;
    }
    return {
      isRelease,
      dataUrl,
      domain,
      presetsUrl: `${ensureSlash(dataUrl)}presets.min.json`,
      releaseVersion,
      result,
      loading: release.loading,
      error: release.error,
    };
  }, [isRelease, dataUrl, releaseVersion, result, release.loading, release.error]);

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}
