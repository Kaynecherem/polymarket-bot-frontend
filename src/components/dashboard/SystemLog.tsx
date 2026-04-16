"use client";

import { useRef, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  signal: "text-accent-blue",
  trade: "text-accent-green",
  error: "text-accent-red",
  bot: "text-accent-orange",
};

export function SystemLog() {
  const systemLog = useAppStore((s) => s.systemLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [systemLog.length]);

  return (
    <Card className="p-4">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        System Log
      </div>
      <ScrollArea className="h-48">
        <div ref={scrollRef} className="space-y-0">
          {systemLog.length === 0 && (
            <div className="py-4 text-center text-[11px] text-muted-foreground">
              Waiting for events...
            </div>
          )}
          {systemLog.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-3 border-b border-border/50 py-1.5 text-[11px]"
            >
              <span className="w-16 shrink-0 text-muted-foreground">{entry.time}</span>
              <span className={cn(TYPE_COLORS[entry.type] || "text-foreground")}>
                {entry.text}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
