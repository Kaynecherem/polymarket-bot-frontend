"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarkets } from "@/lib/api";
import { useWebSocket } from "./use-websocket";

export function useMarkets(params?: { page?: number; limit?: number; search?: string }) {
  const wsStatus = useWebSocket();

  return useQuery({
    queryKey: ["markets", params?.page ?? 1, params?.limit ?? 50, params?.search ?? ""],
    queryFn: () => fetchMarkets(params),
    refetchInterval: wsStatus === "connected" ? false : 30000,
    placeholderData: (prev) => prev,
  });
}
