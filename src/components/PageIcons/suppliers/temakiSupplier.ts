import { type RawGlobMap, buildSetEntries } from "../iconSupplierShared";

export async function loadTemakiEntries() {
  const paths = import.meta.glob("/node_modules/@rapideditor/temaki/icons/*.svg", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as RawGlobMap;
  return buildSetEntries("temaki", paths);
}
