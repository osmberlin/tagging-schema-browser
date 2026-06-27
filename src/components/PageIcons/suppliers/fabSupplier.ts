import { buildFontAwesomeEntries } from "../iconSupplierShared";

export async function loadFabEntries() {
  const faBrands = await import("@fortawesome/free-brands-svg-icons");
  return buildFontAwesomeEntries("fab", faBrands);
}
