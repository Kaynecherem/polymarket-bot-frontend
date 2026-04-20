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
      <div className="mb-2 hidden md:grid grid-cols-7 gap-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
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

          return (
            <div
              key={trade.id || i}
              className="cursor-pointer border-b border-border/50 py-2 transition-colors hover:bg-muted/30"
              onClick={() => setSelectedTrade(trade)}
            >
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-7 gap-2 text-[11px]">
                <span className="text-muted-foreground">{formatTimestamp(trade.timestamp)}</span>
                <span>
                  <Badge variant="green" className="text-[9px]">BUY</Badge>
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
                <span className={`text-right font-semibold ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                </span>
              </div>

              {/* Mobile card */}
              <div className="md:hidden space-y-1.5">
                <div className="text-[11px] text-foreground leading-tight">
                  {truncate(trade.market_question || trade.market_id, 55)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                  {formatTimestamp(trade.timestamp)}
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
          isOpen: false,
        } : null}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </Card>
  );
}
