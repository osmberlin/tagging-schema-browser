import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  PR_LIST_KEY,
  type PrPreviewRow,
  checkPreviewReady,
  fetchRecentPulls,
  previewStatusQueryKey,
} from "./prPreviewQueries";

export type PreviewStatus = "pending" | "ready" | "missing";

export function usePrPreviews() {
  const pullsQuery = useQuery({
    queryKey: PR_LIST_KEY,
    queryFn: () => fetchRecentPulls(30),
  });

  const pulls = pullsQuery.data ?? [];

  const previewQueries = useQueries({
    queries: pulls.map((pr) => ({
      queryKey: previewStatusQueryKey(pr.number),
      queryFn: () => checkPreviewReady(pr.number),
      enabled: pulls.length > 0,
    })),
  });

  const previewStatusByNumber = useMemo(() => {
    const map = new Map<number, PreviewStatus>();
    for (let i = 0; i < pulls.length; i++) {
      const pr = pulls[i] as PrPreviewRow;
      const query = previewQueries[i];
      if (!query) continue;
      if (query.isPending) {
        map.set(pr.number, "pending");
      } else if (query.data === true) {
        map.set(pr.number, "ready");
      } else {
        map.set(pr.number, "missing");
      }
    }
    return map;
  }, [pulls, previewQueries]);

  return {
    pulls,
    previewStatusByNumber,
    isLoading: pullsQuery.isLoading,
    isError: pullsQuery.isError,
    error: pullsQuery.error,
    refetch: pullsQuery.refetch,
  };
}
