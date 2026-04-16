"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveEvents } from "@/hooks/use-live-events";
import { truncate, formatPrice } from "@/lib/utils";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function LiveEventsPanel() {
  const { data, isLoading } = useLiveEvents();

  if (isLoading) {
    return <Skeleton className="h-40 rounded-lg" />;
  }

  const live = data?.live_markets ?? [];
  const clusters = data?.clusters ?? [];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Live Events
        </div>
        <div className="flex gap-1">
          <Badge
            variant={live.length > 0 ? "red" : "secondary"}
            className={`text-[9px] ${live.length > 0 ? "animate-pulse" : ""}`}
          >
            ⚡ {live.length} LIVE
          </Badge>
          {clusters.length > 0 && (
            <Badge variant="green" className="text-[9px]">
              {clusters.length} CLUSTER{clusters.length === 1 ? "" : "S"}
            </Badge>
          )}
        </div>
      </div>

      {live.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No live events detected
        </div>
      ) : (
        <ScrollArea className="max-h-[240px]">
          <div className="space-y-1">
            {live.map((m) => (
              <div
                key={m.market_id}
                className="flex items-center justify-between rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-[11px]"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{truncate(m.question, 40)}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {m.category || "—"} · {formatPrice(m.yes_price)} · {formatDuration(m.duration_seconds)}
                  </span>
                </div>
                <Badge variant="red" className="ml-2 text-[8px] animate-pulse">
                  ⚡ LIVE
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {clusters.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <div className="mb-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            Arb Clusters
          </div>
          <div className="space-y-0.5">
            {clusters.map((c) => (
              <div key={c.market_id} className="flex justify-between text-[10px]">
                <span className="truncate text-muted-foreground">{truncate(c.market_id, 20)}</span>
                <span className="text-accent-green">
                  {c.closes_in_window} wins · {c.trades_used} boosted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
