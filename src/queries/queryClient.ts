import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Schema JSON is versioned CDN content — avoid refetch churn on navigation. */
export const SCHEMA_STALE_TIME = 30 * 60 * 1000
