import { buildFontAwesomeEntries } from '../iconSupplierShared'

export async function loadFarEntries() {
  const faRegular = await import('@fortawesome/free-regular-svg-icons')
  return buildFontAwesomeEntries('far', faRegular)
}
