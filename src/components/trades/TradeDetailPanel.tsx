"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { STRATEGY_META } from "@/lib/constants";
import { formatPrice, formatCurrency, formatPnl } from "@/lib/utils";
import { executeTrade } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Strategy } from "@/lib/types";

interface TradeDetail {
  id?: number;
  market_id: string;
  market_question?: string;
  question?: string;
  side: string;
  strategy: string;
  tier?: string;
  price?: number;
  entry_price?: number;
  exit_price?: number;
  current_price?: number;
  size_usdc: number;
  pnl?: number;
  unrealised_pnl?: number;
  unrealised_pnl_pct?: number;
  timestamp?: number;
  opened_at?: string;
  duration_minutes?: number;
  time_remaining?: string;
  max_hold_time?: string;
  auto_close_at?: string;
  take_profit_price?: number;
  stop_loss_price?: number;
  distance_to_tp_pct?: number;
  distance_to_sl_pct?: number;
  entry_slippage?: number;
  fee_paid?: number;
  edge_at_entry?: number;
  confidence_at_entry?: number;
  rationale?: string;
  current_edge?: number;
  peak_edge?: number;
  regime_at_entry?: string;
  close_reason?: string;
  closed_at?: string;
  hold_duration_seconds?: number;
  paper_mode?: number | boolean;
  order_id?: string;
  isOpen?: boolean;
}

function TPSLBar({ entry, current, tp, sl }: { entry: number; current: number; tp: number; sl: number }) {
  if (!entry || !tp || !sl || tp === sl) return null;
  const range = tp - sl;
  const entryPct = ((entry - sl) / range) * 100;
  const currentPct = Math.max(0, Math.min(100, ((current - sl) / range) * 100));

  return (
    <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
      <div className="absolute inset-y-0 left-0 bg-accent-red/30" style={{ width: `${entryPct}%` }} />
      <div className="absolute inset-y-0 right-0 bg-accent-green/30" style={{ width: `${100 - entryPct}%` }} />
      <div
        className="absolute top-0 h-full w-0.5 bg-muted-foreground"
        style={{ left: `${entryPct}%` }}
        title={`Entry: ${formatPrice(entry)}`}
      />
      <div
        className="absolute top-0 h-full w-1 rounded-full bg-foreground"
        style={{ left: `${currentPct}%` }}
        title={`Current: ${formatPrice(current)}`}
      />
    </div>
  );
}

export function TradeDetailPanel({
  trade,
  open,
  onClose,
}: {
  trade: TradeDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  if (!trade) return null;

  const isOpen = trade.isOpen ?? false;
  const question = trade.question || trade.market_question || trade.market_id;
  const entry = trade.entry_price ?? trade.price ?? 0;
  const current = isOpen
    ? (trade.current_price ?? entry)
    : (trade.exit_price ?? trade.current_price ?? trade.price ?? entry);
  const pnl = isOpen ? (trade.unrealised_pnl ?? 0) : (trade.pnl ?? 0);
  const pnlPct = trade.unrealised_pnl_pct ?? (entry > 0 && trade.size_usdc > 0 ? (pnl / trade.size_usdc * 100) : 0);
  const tp = trade.take_profit_price ?? 0;
  const sl = trade.stop_loss_price ?? 0;
  const tier = trade.tier ?? "swing";

  const badgeVariant = trade.strategy === "arbitrage" ? "green" as const
    : trade.strategy === "sentiment" ? "blue" as const
    : "orange" as const;

  const handleClose = async () => {
    try {
      await executeTrade({ market_id: trade.market_id, signal_id: "", action: "skip" });
      toast.success("Position close requested");
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      onClose();
    } catch (err) {
      toast.error("Failed to close position");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm leading-relaxed">{question}</SheetTitle>
          <SheetDescription className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant={trade.side === "yes" ? "green" : "red"}>
              {trade.side?.toUpperCase()}
            </Badge>
            <Badge variant={badgeVariant}>
              {STRATEGY_META[trade.strategy as Strategy]?.label || trade.strategy}
            </Badge>
            <Badge variant={tier === "scalp" ? "blue" : "secondary"}>
              {tier.toUpperCase()}
            </Badge>
            <Badge variant={isOpen ? "green" : "secondary"}>
              {isOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {/* Price Section */}
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Price</div>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[10px] text-muted-foreground">Entry</div>
                <div className="text-base font-bold">{formatPrice(entry)}</div>
              </div>
              <span className="text-muted-foreground">&rarr;</span>
              <div>
                <div className="text-[10px] text-muted-foreground">{isOpen ? "Current" : "Exit"}</div>
                <div className="text-base font-bold">{formatPrice(current)}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] text-muted-foreground">P&L</div>
                <div className={`text-lg font-bold ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {formatPnl(pnl)}
                </div>
                <div className={`text-[10px] ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* TP/SL Bar */}
          {tp > 0 && sl > 0 && (
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Risk Levels</div>
              <TPSLBar entry={entry} current={current} tp={tp} sl={sl} />
              <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
                <span className="text-accent-red">SL: {formatPrice(sl)}</span>
                <span>Entry: {formatPrice(entry)}</span>
                <span className="text-accent-green">TP: {formatPrice(tp)}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Position Details */}
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Position</div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <Row label="Size" value={formatCurrency(trade.size_usdc)} />
              {trade.fee_paid ? <Row label="Fee Paid" value={formatCurrency(trade.fee_paid)} /> : null}
              {trade.entry_slippage ? <Row label="Slippage" value={`${((trade.entry_slippage / entry) * 100).toFixed(2)}%`} /> : null}
            </div>
          </div>

          <Separator />

          {/* Timing */}
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Timing</div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <Row label="Opened" value={trade.opened_at ? new Date(trade.opened_at).toLocaleString() : trade.timestamp ? new Date(trade.timestamp * 1000).toLocaleString() : "\u2014"} />
              {isOpen && trade.duration_minutes != null && (
                <Row label="Duration" value={`${Math.floor(trade.duration_minutes / 60)}h ${Math.round(trade.duration_minutes % 60)}m`} />
              )}
              {isOpen && trade.time_remaining && <Row label="Time Left" value={trade.time_remaining} />}
              {isOpen && trade.max_hold_time && <Row label="Max Hold" value={trade.max_hold_time} />}
              {!isOpen && trade.close_reason && <Row label="Close Reason" value={trade.close_reason} />}
              {!isOpen && trade.hold_duration_seconds != null && trade.hold_duration_seconds > 0 && (
                <Row label="Held For" value={`${Math.floor(trade.hold_duration_seconds / 3600)}h ${Math.round((trade.hold_duration_seconds % 3600) / 60)}m`} />
              )}
            </div>
          </div>

          {/* Signal Details */}
          {(trade.edge_at_entry || trade.confidence_at_entry || trade.rationale || trade.regime_at_entry) && (
            <>
              <Separator />
              <div>
                <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Signal</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {trade.edge_at_entry ? <Row label="Edge at Entry" value={`${(trade.edge_at_entry * 100).toFixed(1)}%`} /> : null}
                  {isOpen && trade.current_edge != null ? <Row label="Current Edge" value={`${(trade.current_edge * 100).toFixed(1)}%`} /> : null}
                  {isOpen && trade.peak_edge != null ? <Row label="Peak Edge" value={`${(trade.peak_edge * 100).toFixed(1)}%`} /> : null}
                  {trade.confidence_at_entry ? <Row label="Confidence" value={`${(trade.confidence_at_entry * 100).toFixed(1)}%`} /> : null}
                  {trade.regime_at_entry ? <Row label="Regime" value={trade.regime_at_entry.replace("_", " ").toUpperCase()} /> : null}
                </div>
                {trade.rationale && (
                  <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{trade.rationale}</p>
                )}
              </div>
            </>
          )}

          {/* Action */}
          {isOpen && (
            <>
              <Separator />
              <Button variant="destructive" className="w-full" onClick={handleClose}>
                Close Position at {formatPrice(current)}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
