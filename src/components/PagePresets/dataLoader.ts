import type { RawCategories, RawFields, RawPresets, RawTranslations } from "@/utils/types";

const REQUIRED_FILES = [
  "presets.min.json",
  "translations/en.min.json",
  "preset_categories.min.json",
  "fields.min.json",
  "preset_defaults.min.json",
] as const;

export type RawSchemaPayload = {
  presets: RawPresets;
  translations: RawTranslations;
  categories: RawCategories;
  fields: RawFields;
  defaults: unknown;
  loadErrors: string[];
};

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

/**
 * Public CORS proxy used only as a fallback. Some hosts (notably netlify PR
 * previews) serve the schema JSON without an `Access-Control-Allow-Origin`
 * header, so a browser-side fetch is blocked. The proxy re-serves it with CORS.
 */
const CORS_PROXY = "https://corsproxy.io/?url=";

async function fetchJson<T>(baseUrl: string, path: string): Promise<T> {
  const url = `${baseUrl}${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return (await res.json()) as T;
  } catch (err) {
    // A CORS/network failure surfaces as a TypeError ("Failed to fetch") with no
    // response. Retry once through a CORS proxy so non-CORS hosts still load.
    if (err instanceof TypeError) {
      const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} (via CORS proxy): ${url}`);
      return (await res.json()) as T;
    }
    throw err;
  }
}

export async function loadSchemaData(dataUrl: string): Promise<RawSchemaPayload> {
  const base = ensureTrailingSlash(dataUrl);
  const loadErrors: string[] = [];
  let presets: RawPresets = {};
  let translations: RawTranslations = {};
  let categories: RawCategories = {};
  let fields: RawFields = {};
  let defaults: unknown = {};

  for (const file of REQUIRED_FILES) {
    try {
      const data = await fetchJson<unknown>(base, file);
      if (file === "presets.min.json") presets = data as RawPresets;
      else if (file === "translations/en.min.json") translations = data as RawTranslations;
      else if (file === "preset_categories.min.json") categories = data as RawCategories;
      else if (file === "fields.min.json") fields = data as RawFields;
      else if (file === "preset_defaults.min.json") defaults = data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      loadErrors.push(`${file}: ${msg}`);
    }
  }

  return { presets, translations, categories, fields, defaults, loadErrors };
}

export function getExpectedFilesHelp(): string {
  return `Expected at dataUrl: ${REQUIRED_FILES.join(", ")}. Example: ?dataUrl=https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6/dist`;
}
