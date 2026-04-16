"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PriceChart } from "./PriceChart";
import { STRATEGY_META } from "@/lib/constants";
import { formatPrice, formatCompact } from "@/lib/utils";
import { executeTrade } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Market, Signal, Strategy } from "@/lib/types";

interface OrderPanelProps {
  market: Market | null;
  signal?: Signal;
  open: boolean;
  onClose: () => void;
}

export function OrderPanel({ market, signal, open, onClose }: OrderPanelProps) {
  const queryClient = useQueryClient();

  if (!market) return null;

  const history = market.price_history || [];

  const handleTrade = async (action: "buy" | "skip") => {
    try {
      await executeTrade({
        market_id: market.id,
        signal_id: signal?.market_id || "",
        action,
      });
      toast.success(action === "buy" ? "Trade executed!" : "Signal skipped");
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    } catch (err) {
      toast.error(`Trade failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const badgeVariant = signal
    ? signal.strategy === "arbitrage" ? "green" as const
      : signal.strategy === "sentiment" ? "blue" as const
      : "orange" as const
    : undefined;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm">{market.question}</SheetTitle>
          <SheetDescription className="text-[10px] uppercase">{market.category}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Price Chart
            </div>
            <PriceChart data={history} height={160} showAxis />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">YES Price</span>
              <div className="mt-1 text-lg font-bold text-accent-green">
                {formatPrice(market.yes_price)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">NO Price</span>
              <div className="mt-1 text-lg font-bold text-accent-red">
                {formatPrice(market.no_price)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Volume</span>
              <div className="mt-1 font-semibold">{formatCompact(market.volume)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Liquidity</span>
              <div className="mt-1 font-semibold">{formatCompact(market.liquidity)}</div>
            </div>
          </div>

          {signal && (
            <>
              <Separator />
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Active Signal
                  </span>
                  {badgeVariant && (
                    <Badge variant={badgeVariant}>
                      {STRATEGY_META[signal.strategy as Strategy]?.label || signal.strategy}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Side: </span>
                    <span className={`font-bold uppercase ${signal.side === "yes" ? "text-accent-green" : "text-accent-red"}`}>
                      {signal.side}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Edge: </span>
                    <span className="font-bold">{(signal.edge * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className="font-bold">{(signal.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
                {signal.rationale && (
                  <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
                    {signal.rationale}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="success" className="flex-1" onClick={() => handleTrade("buy")}>
                  BUY {signal.side.toUpperCase()}
                </Button>
                <Button variant="muted" className="flex-1" onClick={() => handleTrade("skip")}>
                  SKIP
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
