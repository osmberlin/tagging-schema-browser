import type { References } from "@/schemaRuntimeDereference/references";

/** Cached references for locale files loaded after the main schema payload. */
let cachedReferences: References | null = null;

export function setSchemaReferences(refs: References | null): void {
  cachedReferences = refs;
}

export function getSchemaReferences(): References | null {
  return cachedReferences;
}
