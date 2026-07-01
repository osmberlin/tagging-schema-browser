import { dereferenceLocaleStrings, getSchemaReferences } from "@/schemaRuntimeDereference";
import type { FieldTranslations } from "@/utils/types";
import { useEffect, useState } from "react";

export type LocaleEntry = { name?: string; terms: string[]; aliases: string[] };
export type LocaleMap = Map<string, LocaleEntry>;

/** Reasonable fallback when locales can't be discovered from the dist host. */
const FALLBACK_LOCALES = [
  "en-GB",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "pl",
  "pt",
  "pt-BR",
  "ru",
  "uk",
  "cs",
  "sk",
  "sv",
  "da",
  "nb",
  "fi",
  "ja",
  "ko",
  "zh-CN",
  "zh-TW",
  "tr",
  "hu",
  "ro",
  "el",
  "ca",
  "eu",
  "gl",
  "he",
  "ar",
  "fa",
  "id",
  "vi",
  "th",
];

function ensureSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function parseTerms(s?: string): string[] {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .split(/\s*,+\s*/)
    .filter(Boolean);
}

function parseAliases(s?: string): string[] {
  return (s ?? "").trim() ? (s as string).split(/\s*[\r\n]+\s*/).filter(Boolean) : [];
}

type JsDelivrNode = { type: string; name: string; files?: JsDelivrNode[] };

function findDir(nodes: JsDelivrNode[] | undefined, name: string): JsDelivrNode | undefined {
  return nodes?.find((n) => n.type === "directory" && n.name === name);
}

/** Discover locale codes from the dist's translations/ folder (jsDelivr only; else a fallback list). */
async function discoverLocales(dataUrl: string): Promise<string[]> {
  const match = dataUrl.match(/cdn\.jsdelivr\.net\/npm\/(.+?)@([^/]+)\//);
  if (match) {
    try {
      const pkg = match[1];
      let version = match[2];
      // The packages tree API needs a concrete version, not a tag like "latest".
      if (!/^\d/.test(version)) {
        const r = await fetch(
          `https://data.jsdelivr.com/v1/packages/npm/${pkg}/resolved?specifier=${encodeURIComponent(version)}`,
        );
        if (r.ok) version = ((await r.json()) as { version?: string }).version ?? version;
      }
      const res = await fetch(`https://data.jsdelivr.com/v1/packages/npm/${pkg}@${version}`);
      if (res.ok) {
        const json = (await res.json()) as { files?: JsDelivrNode[] };
        const dist = findDir(json.files, "dist");
        const translations = findDir(dist?.files, "translations");
        const locales = (translations?.files ?? [])
          .filter((f) => f.type === "file" && f.name.endsWith(".min.json"))
          .map((f) => f.name.replace(/\.min\.json$/, ""))
          .filter((code) => code !== "en");
        if (locales.length) return locales.sort((a, b) => a.localeCompare(b));
      }
    } catch {
      // fall through to the fallback list
    }
  }
  return FALLBACK_LOCALES;
}

export function useLocales(dataUrl: string | null) {
  const [locales, setLocales] = useState<string[]>(FALLBACK_LOCALES);
  useEffect(() => {
    if (!dataUrl) return;
    let cancelled = false;
    discoverLocales(dataUrl).then((list) => {
      if (!cancelled) setLocales(list);
    });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);
  return locales;
}

async function loadLocale(
  dataUrl: string,
  locale: string,
): Promise<{ presets: LocaleMap; fields: FieldTranslations }> {
  const res = await fetch(`${ensureSlash(dataUrl)}translations/${locale}.min.json`);
  if (!res.ok) throw new Error(`No translations for "${locale}" (HTTP ${res.status})`);
  const json = (await res.json()) as Record<
    string,
    {
      presets?: {
        presets?: Record<string, { name?: string; terms?: string; aliases?: string }>;
        fields?: FieldTranslations;
      };
    }
  >;
  const tstrings = {
    presets: json[locale]?.presets?.presets ?? {},
    fields: json[locale]?.presets?.fields ?? {},
  };
  const references = getSchemaReferences();
  if (references) {
    dereferenceLocaleStrings(tstrings, references);
  }

  const map: LocaleMap = new Map();
  for (const [id, value] of Object.entries(tstrings.presets)) {
    map.set(id, {
      name: value.name,
      terms: parseTerms(value.terms),
      aliases: parseAliases(value.aliases),
    });
  }
  return { presets: map, fields: tstrings.fields };
}

export function useLocaleTranslations(dataUrl: string | null, locale: string) {
  const [state, setState] = useState<{
    map: LocaleMap | null;
    fieldMap: FieldTranslations | null;
    loading: boolean;
    error: string | null;
  }>({ map: null, fieldMap: null, loading: false, error: null });
  useEffect(() => {
    if (!dataUrl || !locale) {
      setState({ map: null, fieldMap: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ map: null, fieldMap: null, loading: true, error: null });
    loadLocale(dataUrl, locale)
      .then(({ presets, fields }) => {
        if (!cancelled) setState({ map: presets, fieldMap: fields, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) {
          setState({
            map: null,
            fieldMap: null,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl, locale]);
  return state;
}
