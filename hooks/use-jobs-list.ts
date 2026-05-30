import { useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";

import { trpc } from "@/lib/trpc";

const REFETCH_MS = 20_000;

/** Shared jobs list query: poll + refresh when tab focused or app returns to foreground. */
export function useJobsList() {
  const query = trpc.jobs.list.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: false,
  });

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, [query.refetch]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void query.refetch();
      }
    });
    return () => sub.remove();
  }, [query.refetch]);

  return query;
}
