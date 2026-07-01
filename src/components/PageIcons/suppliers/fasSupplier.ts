import { buildFontAwesomeEntries } from '../iconSupplierShared'

export async function loadFasEntries() {
  const faSolid = await import('@fortawesome/free-solid-svg-icons')
  return buildFontAwesomeEntries('fas', faSolid)
}
