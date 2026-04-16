"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLiveEvents } from "@/lib/api";

export function useLiveEvents() {
  return useQuery({
    queryKey: ["live-events"],
    queryFn: fetchLiveEvents,
    refetchInterval: 10000,
    placeholderData: (prev) => prev,
  });
}
