/** Vite base path for absolute in-app links (new tab). */
export function routerBasepath(): string {
  const trimmed = import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : '/'
}
