/** Fetch schema JSON from a full URL. All supported hosts send CORS headers. */
export async function fetchSchemaJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return (await res.json()) as T
}
