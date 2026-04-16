"use client";

import { useState, useRef, useEffect } from "react";
import { useActivity } from "@/hooks/use-activity";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, { dot: string; text: string }> = {
  signal_detected: { dot: "bg-accent-blue", text: "text-accent-blue" },
  trade_opened: { dot: "bg-accent-green", text: "text-accent-green" },
  trade_closed: { dot: "bg-accent-orange", text: "text-accent-orange" },
  trade_rejected: { dot: "bg-accent-red", text: "text-accent-red" },
  cooldown_blocked: { dot: "bg-accent-orange", text: "text-accent-orange" },
  duplicate_blocked: { dot: "bg-accent-orange", text: "text-muted-foreground" },
  drawdown_halt: { dot: "bg-accent-red", text: "text-accent-red" },
  circuit_breaker: { dot: "bg-accent-red", text: "text-accent-red" },
  llm_scored: { dot: "bg-purple-500", text: "text-purple-400" },
  bot_started: { dot: "bg-accent-orange", text: "text-accent-orange" },
  bot_stopped: { dot: "bg-accent-orange", text: "text-accent-orange" },
  position_updated: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
  // V3: Regime, entry timer, edge decay events
  entry_pending: { dot: "bg-accent-blue", text: "text-accent-blue" },
  entry_confirmed: { dot: "bg-accent-green", text: "text-accent-green" },
  entry_cancelled: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
  edge_exit: { dot: "bg-accent-orange", text: "text-accent-orange" },
  regime_change: { dot: "bg-purple-500", text: "text-purple-400" },
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "trade_opened", label: "Trades" },
  { key: "signal_detected", label: "Signals" },
  { key: "trade_rejected", label: "Rejections" },
  { key: "trade_closed", label: "Closes" },
];

export function ActivityFeed() {
  const [filter, setFilter] = useState("");
  const { data: events, isLoading } = useActivity(50, filter);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [events?.length]);

  if (isLoading) {
    return <Skeleton className="h-64 rounded-lg" />;
  }

  const items = events ?? [];

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Activity Feed
        </span>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "ghost"}
              size="sm"
              className="h-5 text-[8px] px-2"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-0">
          {items.length === 0 && (
            <div className="py-8 text-center text-[11px] text-muted-foreground">
              No activity yet
            </div>
          )}
          {items.map((event, i) => {
            const styles = TYPE_STYLES[event.type] || { dot: "bg-muted-foreground", text: "text-foreground" };
            const ts = new Date(event.timestamp).toLocaleTimeString();

            return (
              <div
                key={`${event.timestamp}-${i}`}
                className="flex items-start gap-2 border-b border-border/30 py-1.5 text-[10px]"
              >
                <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
                <span className="w-14 shrink-0 text-muted-foreground">{ts}</span>
                <span className={cn("flex-1 leading-relaxed", styles.text)}>
                  {event.message}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
