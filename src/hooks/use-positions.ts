"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/lib/api";

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
    refetchInterval: 10000,
    placeholderData: (prev) => prev,
  });
}
