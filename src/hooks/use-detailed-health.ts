"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDetailedHealth } from "@/lib/api";

export function useDetailedHealth() {
  return useQuery({
    queryKey: ["health-detailed"],
    queryFn: fetchDetailedHealth,
    refetchInterval: 15000,
    placeholderData: (prev) => prev,
  });
}
