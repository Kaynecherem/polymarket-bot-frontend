"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMoneyTrail } from "@/lib/api";

export function useMoneyTrail() {
  return useQuery({
    queryKey: ["money-trail"],
    queryFn: fetchMoneyTrail,
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });
}
