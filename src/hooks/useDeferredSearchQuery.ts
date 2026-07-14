import { useDeferredValue } from 'react'

/**
 * Defers expensive filter/render work while keeping the search input responsive.
 * Pair with virtualization so filtering and DOM updates do not block typing.
 */
export function useDeferredSearchQuery(query: string) {
  const deferredQuery = useDeferredValue(query)
  return {
    deferredQuery,
    isSearchPending: deferredQuery !== query,
  }
}
