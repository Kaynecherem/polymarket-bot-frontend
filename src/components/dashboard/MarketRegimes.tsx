"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRegimes } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const REGIME_COLORS: Record<string, string> = {
  trending: "text-accent-blue",
  mean_reverting: "text-accent-green",
  event_driven: "text-purple-400",
  low_activity: "text-muted-foreground",
};

const REGIME_LABELS: Record<string, string> = {
  trending: "Trending",
  mean_reverting: "Mean Reverting",
  event_driven: "Event",
  low_activity: "Low",
};

export function MarketRegimes() {
  const { data, isLoading } = useQuery({
    queryKey: ["regimes"],
    queryFn: fetchRegimes,
    refetchInterval: 30000,
  });

  if (isLoading) return <Skeleton className="h-10 rounded-lg" />;

  const counts = data?.counts ?? {};

  return (
    <Card className="flex items-center gap-4 px-4 py-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Regimes
      </span>
      {Object.entries(REGIME_LABELS).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${REGIME_COLORS[key]}`}>
            {counts[key] ?? 0}
          </span>
          <span className="text-[9px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </Card>
  );
}
