"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWalletPositions } from "@/lib/api";

export function useWalletPositions() {
  return useQuery({
    queryKey: ["wallet-positions"],
    queryFn: fetchWalletPositions,
    // 30s — data-api isn't real-time, no need to hammer it
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });
}
