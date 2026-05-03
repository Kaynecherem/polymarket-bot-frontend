"use client";

import { useState } from "react";
import { TradeDetailPanel } from "./TradeDetailPanel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STRATEGY_META } from "@/lib/constants";
import { formatPrice, formatTimestamp, truncate } from "@/lib/utils";
import type { Trade, Strategy } from "@/lib/types";
import { ArrowUpDown } from "lucide-react";

interface TradeTableProps {
  trades: Trade[];
}

type SortField = "timestamp" | "price" | "pnl" | "size_usdc";

export function TradeTable({ trades }: TradeTableProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStrategy, setFilterStrategy] = useState<string>("all");

  const filteredTrades = filterStrategy === "all"
    ? trades
    : trades.filter((t) => t.strategy === filterStrategy);

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    return mul * ((a[sortField] as number) - (b[sortField] as number));
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const strategies = ["all", ...new Set(trades.map((t) => t.strategy))];

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Trade History
        </span>
        <div className="flex flex-wrap gap-1">
          {strategies.map((s) => (
            <Button
              key={s}
              variant={filterStrategy === s ? "default" : "ghost"}
              size="sm"
              className="text-[9px]"
              onClick={() => setFilterStrategy(s)}
            >
              {s === "all" ? "All" : (STRATEGY_META[s as Strategy]?.label || s)}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop header — hidden on mobile */}
      <div className="mb-2 hidden md:grid grid-cols-8 gap-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("timestamp")}>
          Time <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <span>Side</span>
        <span className="col-span-2">Market</span>
        <button className="flex items-center gap-1" onClick={() => toggleSort("price")}>
          Price <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <span>Strategy</span>
        <button className="flex items-center gap-1 text-right" onClick={() => toggleSort("pnl")}>
          P&L <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <span className="text-right">Spread</span>
      </div>

      {/* Mobile sort buttons */}
      <div className="mb-2 flex gap-2 md:hidden">
        {(["timestamp", "pnl"] as SortField[]).map((f) => (
          <Button key={f} variant="ghost" size="sm" className="text-[9px] gap-1" onClick={() => toggleSort(f)}>
            {f === "timestamp" ? "Time" : "P&L"} <ArrowUpDown className="h-2.5 w-2.5" />
          </Button>
        ))}
      </div>

      <ScrollArea className="h-[400px]">
        {sortedTrades.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">No trades yet</div>
        )}
        {sortedTrades.map((trade, i) => {
          const pnl = trade.pnl || 0;
          const badgeVariant = trade.strategy === "arbitrage" ? "green" as const
            : trade.strategy === "sentiment" ? "blue" as const
            : "orange" as const;

          // Backend sends side="yes"|"no" for open cycles, "close_yes"|"close_no"
          // for terminal cycles. Strip the prefix for display and show a
          // separate state badge so operators can tell open from closed at a glance.
          const sideRaw = (trade.side || "").toString();
          const isClosed = sideRaw.startsWith("close_") || trade.is_terminal === true || (trade.is_open === false && !!trade.closed_at);
          const direction = sideRaw.replace(/^close_/, "").toUpperCase() || "—";
          const sideVariant: "green" | "red" | "secondary" =
            direction === "YES" ? "green" : direction === "NO" ? "red" : "secondary";
          const stateLabel = isClosed ? "CLOSED" : "OPEN";
          const stateVariant: "secondary" | "blue" = isClosed ? "secondary" : "blue";
          const pnlLabel = isClosed ? "P&L" : "Unrealised";

          return (
            <div
              key={trade.id || i}
              className="cursor-pointer border-b border-border/50 py-2 transition-colors hover:bg-muted/30"
              onClick={() => setSelectedTrade(trade)}
            >
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-8 gap-2 text-[11px]">
                <span className="text-muted-foreground">{formatTimestamp(trade.timestamp)}</span>
                <span className="flex flex-wrap gap-1">
                  <Badge variant={sideVariant} className="text-[9px]">{direction}</Badge>
                  <Badge variant={stateVariant} className="text-[8px]">{stateLabel}</Badge>
                </span>
                <span className="col-span-2 truncate text-foreground">
                  {truncate(trade.market_question || trade.market_id, 40)}
                </span>
                <span>{formatPrice(trade.price)}</span>
                <span>
                  <Badge variant={badgeVariant} className="text-[9px]">
                    {STRATEGY_META[trade.strategy as Strategy]?.label || trade.strategy}
                  </Badge>
                </span>
                <span
                  className={`text-right font-semibold ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}
                  title={pnlLabel}
                >
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                </span>
                <span
                  className="text-right text-accent-orange/80 tabular-nums"
                  title="Entry/exit spread cost — fill price vs midpoint at fill time. Not a Polymarket fee; it's the cost of crossing the book."
                >
                  {(trade.fee_paid ?? 0) > 0.005 ? `-$${(trade.fee_paid ?? 0).toFixed(2)}` : "—"}
                </span>
              </div>

              {/* Mobile card */}
              <div className="md:hidden space-y-1.5">
                <div className="text-[11px] text-foreground leading-tight">
                  {truncate(trade.market_question || trade.market_id, 55)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={sideVariant} className="text-[8px]">{direction}</Badge>
                    <Badge variant={stateVariant} className="text-[8px]">{stateLabel}</Badge>
                    <Badge variant={badgeVariant} className="text-[8px]">
                      {STRATEGY_META[trade.strategy as Strategy]?.label || trade.strategy}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">@ {formatPrice(trade.price)}</span>
                  </div>
                  <span className={`text-[12px] font-bold tabular-nums ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                    {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                  </span>
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {formatTimestamp(trade.timestamp)} {isClosed ? "" : `· ${pnlLabel.toLowerCase()}`}
                </div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
      <TradeDetailPanel
        trade={selectedTrade ? {
          ...selectedTrade,
          market_question: selectedTrade.market_question,
          question: selectedTrade.market_question,
          entry_price: selectedTrade.entry_price || selectedTrade.price,
          exit_price: selectedTrade.exit_price || selectedTrade.price,
          // Use backend-provided open/terminal flags. Was hardcoded false,
          // so the detail panel always rendered as if every trade were
          // closed even when it was still open.
          isOpen: selectedTrade.is_open === true
            || (selectedTrade.is_terminal === false && !selectedTrade.closed_at),
        } : null}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </Card>
  );
}
