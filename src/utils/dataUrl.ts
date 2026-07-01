import { INTEREM_DATA_URL, RELEASE_DATA_URL } from "@/utils/constants";

export type SchemaReference = "release" | "interem";

function ensureSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

/** True when the URL is a built-in release or interem dataset (not a custom PR preview). */
export function isCanonicalDataUrl(url: string): boolean {
  const normalized = ensureSlash(url);
  return (
    normalized === ensureSlash(RELEASE_DATA_URL) || normalized === ensureSlash(INTEREM_DATA_URL)
  );
}

export function dataUrlForReference(reference: SchemaReference): string {
  return reference === "interem" ? INTEREM_DATA_URL : RELEASE_DATA_URL;
}

/** URL `reference=release` wins; otherwise use persisted preference (default interem). */
export function resolveSchemaReference(
  urlReference: SchemaReference | undefined,
  persistedReference: SchemaReference,
): SchemaReference {
  if (urlReference === "release") return "release";
  if (urlReference === "interem") return "interem";
  return persistedReference;
}

/** Param value when switching reference via the header toggle (interem omits the param). */
export function referenceSearchParam(reference: SchemaReference): SchemaReference | undefined {
  return reference === "release" ? "release" : undefined;
}

/** Pick the active dist base: explicit `dataUrl` wins over the reference toggle. */
export function resolveActiveDataUrl(dataUrl: string, reference: SchemaReference): string {
  const trimmed = dataUrl.trim();
  if (trimmed) return trimmed;
  return dataUrlForReference(reference);
}
