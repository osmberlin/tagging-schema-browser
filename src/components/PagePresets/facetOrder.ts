type Bucket = { key: string; doc_count: number }

/** Module-level stable facet order — survives filter changes without ref access during render. */
const stableFacetOrders = new Map<string, string[]>()

export function stableFacetBuckets(facetKey: string, buckets: Bucket[]): Bucket[] {
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  const prev = stableFacetOrders.get(facetKey) ?? []
  const known = new Set(prev)
  const order = [...prev]
  for (const bucket of buckets) {
    if (!known.has(bucket.key)) {
      order.push(bucket.key)
      known.add(bucket.key)
    }
  }
  stableFacetOrders.set(facetKey, order)
  return order.map((key) => bucketMap.get(key) ?? { key, doc_count: 0 })
}
