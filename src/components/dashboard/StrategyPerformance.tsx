"use client";

import { usePortfolio } from "@/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { STRATEGY_META } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Strategy } from "@/lib/types";

const ALL_STRATEGIES: { key: string; label: string; color: string }[] = [
  { key: "arbitrage", label: "Arbitrage", color: "hsl(154 100% 50%)" },
  { key: "reversion", label: "Mean Reversion", color: "hsl(40 100% 50%)" },
  { key: "sentiment", label: "Sentiment", color: "hsl(224 100% 73%)" },
  { key: "cross_market", label: "Cross-Market", color: "hsl(280 80% 60%)" },
  { key: "composite", label: "Composite", color: "hsl(0 0% 70%)" },
];

export function StrategyPerformance() {
  const { data: portfolio, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-2">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  const perf = portfolio?.strategy_performance;

  return (
    <div>
      <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Strategy Performance
      </div>
      <div className="grid grid-cols-1 gap-2">
        {ALL_STRATEGIES.map((strat) => {
          const data = perf?.[strat.key];
          const winRate = data?.win_rate ?? 0;
          const wrColor = winRate > 55 ? "text-accent-green" : winRate < 45 ? "text-accent-red" : "text-accent-orange";
          const pnl = data?.pnl ?? 0;
          const avgWin = data?.avg_win ?? 0;
          const avgLoss = data?.avg_loss ?? 0;
          const wlRatio = data?.win_loss_ratio ?? 0;
          const avgHold = data?.avg_hold_seconds ?? 0;
          const holdLabel = avgHold >= 3600 ? `${(avgHold / 3600).toFixed(1)}h` : avgHold >= 60 ? `${Math.round(avgHold / 60)}m` : `${Math.round(avgHold)}s`;
          const wlColor = wlRatio >= 2 ? "text-accent-green" : wlRatio >= 1 ? "text-accent-orange" : wlRatio > 0 ? "text-accent-red" : "text-muted-foreground";

          return (
            <Card key={strat.key} className="px-3 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-[100px]">
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: strat.color }} />
                  <span className="text-[11px] font-semibold">{strat.label}</span>
                </div>
                <div className="flex items-center gap-5 text-[10px]">
                  <div className="text-center">
                    <span className="text-muted-foreground">Trades </span>
                    <span>{data?.total ?? 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground">WR </span>
                    <span className={wrColor}>{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground">P&L </span>
                    <span className={pnl >= 0 ? "text-accent-green" : "text-accent-red"}>
                      {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                    </span>
                  </div>
                </div>
              </div>
              {(data?.total ?? 0) > 0 && (
                <div className="mt-1.5 flex items-center gap-4 pl-4 text-[9px] text-muted-foreground">
                  <span>W/L: <span className={wlColor}>{wlRatio > 0 ? `${wlRatio}:1` : "—"}</span></span>
                  <span>Avg Win: <span className="text-accent-green">{formatCurrency(avgWin)}</span></span>
                  <span>Avg Loss: <span className="text-accent-red">{formatCurrency(avgLoss)}</span></span>
                  <span>Hold: {holdLabel}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
