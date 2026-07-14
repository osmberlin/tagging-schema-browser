import { useSchema } from '@/hooks/useSchema'

/** Fields list + facet metadata — reads the catalog precomputed at schema load. */
export function useFieldSearch() {
  const { data } = useSchema()
  return {
    fields: data?.indices.fieldCatalog ?? [],
    types: data?.indices.fieldTypes ?? [],
  }
}
