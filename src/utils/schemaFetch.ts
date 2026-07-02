/**
 * Public CORS proxy used when a schema host does not send
 * `Access-Control-Allow-Origin` (Netlify staging / PR previews).
 *
 * GitHub Pages is a static SPA — no server-side proxy or Netlify-style rewrites.
 * Release dist loads directly from jsDelivr; only Netlify-hosted schema URLs need
 * the proxy until id-tagging-schema previews ship CORS headers.
 */
const CORS_PROXY = 'https://corsproxy.io/?url='

/** Hosts that cannot be read cross-origin from the browser without a proxy. */
export function schemaFetchNeedsCorsProxy(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    if (hostname === 'ideditor.netlify.app') return true
    if (hostname.endsWith('.netlify.app')) return true
    return false
  } catch {
    return false
  }
}

async function fetchViaProxy<T>(url: string): Promise<T> {
  const proxied = `${CORS_PROXY}${encodeURIComponent(url)}`
  const res = await fetch(proxied)
  if (!res.ok) throw new Error(`HTTP ${res.status} (via CORS proxy): ${url}`)
  return (await res.json()) as T
}

/** Fetch schema JSON from a full URL, using the CORS proxy when required. */
export async function fetchSchemaJson<T>(url: string): Promise<T> {
  if (schemaFetchNeedsCorsProxy(url)) {
    return fetchViaProxy<T>(url)
  }

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof TypeError) {
      return fetchViaProxy<T>(url)
    }
    throw err
  }
}
