"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchActivity } from "@/lib/api";

export function useActivity(limit = 100, type = "") {
  return useQuery({
    queryKey: ["activity", limit, type],
    queryFn: () => fetchActivity(limit, type),
    refetchInterval: 15000,
    placeholderData: (prev) => prev,
  });
}
