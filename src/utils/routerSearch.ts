import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'

const parseSearch = parseSearchWith(JSON.parse)
const stringifySearchDefault = stringifySearchWith(JSON.stringify)

/**
 * Decode the URL-safe characters that TanStack Router percent-encodes by
 * default so shared links read nicely (e.g. `dataUrl=https://…/dist/` and
 * `iconName=["far-credit-card"]` instead of `%2F`/`%5B%22…`).
 *
 * Only characters that are safe inside a query string are decoded — the strong
 * URL breakers (`#`, `&`, `=`, `?`, `%`, `+`, `<`, `>`, backtick) stay encoded.
 * Ported from osm-traffic-sign-tools. See also
 * https://github.com/47ng/nuqs/issues/355
 */
const makeSearchPretty = (searchString: string) => {
  const result = searchString
    .replaceAll('%22', '"') // quoted array values (iconName, categoryNames, …)
    .replaceAll('%2C', ',') // separators between array items
    .replaceAll('%5B', '[') // array brackets
    .replaceAll('%5D', ']')
    .replaceAll('%7B', '{') // object braces
    .replaceAll('%7D', '}')

  // Slashes, colons, and @ are only safe to decode in dataUrl (dist base path).
  // Decoding them globally breaks text search params like f_q=healthcare/speciality.
  return result.replace(
    /([?&]dataUrl=)([^&]*)/g,
    (_, prefix, value) =>
      prefix + value.replaceAll('%2F', '/').replaceAll('%3A', ':').replaceAll('%40', '@'),
  )
}

export const routerSearch = {
  parse: parseSearch,
  stringify: (search: Record<string, unknown>) => {
    return makeSearchPretty(stringifySearchDefault(search))
  },
}
