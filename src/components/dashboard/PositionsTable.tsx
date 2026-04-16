"use client";

import { usePositions } from "@/hooks/use-positions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { STRATEGY_META } from "@/lib/constants";
import { formatPrice, formatCurrency, truncate } from "@/lib/utils";
import { closePosition } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { TradeDetailPanel } from "@/components/trades/TradeDetailPanel";
import type { Position, Strategy } from "@/lib/types";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export function PositionsTable() {
  const { data: positions, isLoading } = usePositions();
  const queryClient = useQueryClient();
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);

  const handleClose = async (marketId: string) => {
    try {
      await closePosition(marketId);
      toast.success("Position closed");
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    } catch (err) {
      toast.error(`Failed to close position: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 rounded-lg" />;
  }

  const items = positions ?? [];
  const totalLocked = items.reduce((s, p) => s + p.size_usdc, 0);
  const totalUnrealised = items.reduce((s, p) => s + p.unrealised_pnl, 0);

  return (
    <>
    <Card className="p-4">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Open Positions ({items.length})
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">No open positions</div>
      ) : (
        <>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-0">
              <div className="mb-2 grid grid-cols-8 gap-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className="col-span-2">Market</span>
                <span>Side</span>
                <span>Entry / Now</span>
                <span>Size</span>
                <span>P&L</span>
                <span>Duration</span>
                <span>Action</span>
              </div>
              {items.map((pos) => {
                const badgeVariant = pos.strategy === "arbitrage" ? "green" as const
                  : pos.strategy === "sentiment" ? "blue" as const
                  : pos.strategy === "cross_market" ? "blue" as const
                  : "orange" as const;
                const pnlColor = pos.unrealised_pnl >= 0 ? "text-accent-green" : "text-accent-red";

                // TP/SL progress: 0 = at entry, 100 = at target
                const tpProgress = Math.max(0, Math.min(100, pos.distance_to_tp_pct));
                const slProgress = Math.max(0, Math.min(100, pos.distance_to_sl_pct));

                return (
                  <div
                    key={pos.market_id}
                    className="grid grid-cols-8 gap-2 border-b border-border/50 py-2 text-[11px] cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setSelectedPos(pos)}
                  >
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="truncate">{truncate(pos.question, 35)}</span>
                      <div className="flex flex-wrap gap-0.5">
                        <Badge variant={badgeVariant} className="w-fit text-[8px]">
                          {STRATEGY_META[pos.strategy as Strategy]?.label || pos.strategy}
                        </Badge>
                        <Badge variant={pos.tier === "scalp" ? "blue" : "secondary"} className="w-fit text-[8px]">
                          {pos.tier.toUpperCase()}
                        </Badge>
                        {pos.is_live_event && (
                          <Badge variant="red" className="w-fit text-[8px] animate-pulse" title="Live event — arb parameters boosted">
                            ⚡ LIVE
                          </Badge>
                        )}
                        {typeof pos.scale_out_level === "number" && pos.scale_out_level > 0 && (
                          <Badge
                            variant={pos.scale_out_level === 2 ? "green" : "orange"}
                            className="w-fit text-[8px]"
                            title={`Scaled out to L${pos.scale_out_level}: ${pos.partial_closes?.length ?? 0} partial close(s), realised $${(pos.realised_partial_pnl ?? 0).toFixed(2)}`}
                          >
                            L{pos.scale_out_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span>
                      <Badge variant={pos.side === "yes" ? "green" : "red"} className="text-[9px]">
                        {pos.side.toUpperCase()}
                      </Badge>
                    </span>
                    <div className="flex flex-col text-[10px]">
                      <span>{formatPrice(pos.entry_price)}</span>
                      <span className="text-muted-foreground">{formatPrice(pos.current_price)}</span>
                    </div>
                    <div className="flex flex-col text-[10px]">
                      <span>{formatCurrency(pos.size_usdc)}</span>
                      {typeof pos.original_size === "number" && pos.original_size > pos.size_usdc && (
                        <span className="text-[9px] text-muted-foreground line-through">
                          {formatCurrency(pos.original_size)}
                        </span>
                      )}
                    </div>
                    <div className={`flex flex-col ${pnlColor}`}>
                      <span className="font-semibold">{pos.unrealised_pnl >= 0 ? "+" : ""}{formatCurrency(pos.unrealised_pnl)}</span>
                      <span className="text-[9px]">{pos.unrealised_pnl_pct >= 0 ? "+" : ""}{pos.unrealised_pnl_pct.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col text-[10px]">
                      <span className="text-muted-foreground">{formatDuration(pos.duration_minutes)}</span>
                      <span className="text-accent-orange text-[9px]">{pos.time_remaining} left</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="bg-accent-red/60" style={{ width: `${slProgress}%` }} />
                        <div className="flex-1" />
                        <div className="bg-accent-green/60" style={{ width: `${tpProgress}%` }} />
                      </div>
                      <Button variant="muted" size="sm" className="h-5 text-[8px] px-2" onClick={(e) => { e.stopPropagation(); handleClose(pos.market_id); }}>
                        CLOSE
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="mt-3 flex gap-4 text-[10px] text-muted-foreground border-t border-border pt-2">
            <span>Locked: {formatCurrency(totalLocked)}</span>
            <span className={totalUnrealised >= 0 ? "text-accent-green" : "text-accent-red"}>
              Unrealised: {totalUnrealised >= 0 ? "+" : ""}{formatCurrency(totalUnrealised)}
            </span>
            <span>Count: {items.length}</span>
          </div>
        </>
      )}
    </Card>
      <TradeDetailPanel
        trade={selectedPos ? { ...selectedPos, isOpen: true } : null}
        open={!!selectedPos}
        onClose={() => setSelectedPos(null)}
      />
    </>
  );
}
