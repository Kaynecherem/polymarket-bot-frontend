"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSignals } from "@/lib/api";
import { useWebSocket } from "./use-websocket";

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: fetchSignals,
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });
}
