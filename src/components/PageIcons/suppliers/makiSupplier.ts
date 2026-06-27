import { type RawGlobMap, buildSetEntries } from "../iconSupplierShared";

export async function loadMakiEntries() {
  const paths = import.meta.glob("/node_modules/@mapbox/maki/icons/*.svg", {
    eager: true,
    import: "default",
    query: "?raw",
  }) as RawGlobMap;
  return buildSetEntries("maki", paths);
}
