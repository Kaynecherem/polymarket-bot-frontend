"use client";

import { useState } from "react";
import { useTrades } from "@/hooks/use-trades";
import { TradeSummary } from "@/components/trades/TradeSummary";
import { TradeTable } from "@/components/trades/TradeTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { motion } from "framer-motion";

export default function TradesContent() {
  const { data: trades, isLoading, error } = useTrades();
  const [tierFilter, setTierFilter] = useState<string>("all");

  const filteredTrades = tierFilter === "all"
    ? (trades || [])
    : (trades || []).filter((t) => t.tier === tierFilter);

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-accent-red">
        Failed to load trades: {error.message}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        {["all", "scalp", "swing"].map((t) => (
          <Button
            key={t}
            variant={tierFilter === t ? "default" : "ghost"}
            size="sm"
            className="text-[10px]"
            onClick={() => setTierFilter(t)}
          >
            {t === "all" ? "All Tiers" : t.toUpperCase()}
          </Button>
        ))}
      </div>

      <TradeSummary />

      {/* Equity Curve */}
      {trades && trades.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Equity Curve
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={(() => {
              // Equity curve = cumulative REALISED P&L. Trade rows now include
              // open cycles whose `pnl` field is unrealised; including those
              // would make the line jitter with mark-to-market on open
              // positions instead of stepping when trades actually close.
              const closed = trades
                .filter((t) => t.is_terminal === true || (t.is_open === false && !!t.closed_at))
                .slice()
                .reverse();
              let cum = 0;
              return closed.map((t, i) => {
                cum += t.pnl || 0;
                return {
                  index: i,
                  pnl: Math.round(cum * 100) / 100,
                  time: new Date(t.timestamp * 1000).toLocaleDateString(),
                };
              });
            })()}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(154 100% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(154 100% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(0 0% 67%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 67%)" }} axisLine={false} tickLine={false} width={50} />
              <RechartsTooltip
                contentStyle={{
                  background: "hsl(0 0% 5.1%)",
                  border: "1px solid hsl(0 0% 12%)",
                  borderRadius: 6,
                  fontSize: 10,
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Cumulative P&L"]}
              />
              <Area type="monotone" dataKey="pnl" stroke="hsl(154 100% 50%)" fill="url(#pnlGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : (
        <TradeTable trades={filteredTrades} />
      )}
    </motion.div>
  );
}
