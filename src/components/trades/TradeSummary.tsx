"use client";

import { usePortfolio } from "@/hooks/use-portfolio";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatPnl } from "@/lib/utils";

export function TradeSummary() {
  const { data: portfolio, isLoading } = usePortfolio();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total Trades"
        value={portfolio?.positions ?? 0}
        loading={isLoading}
      />
      <StatCard
        label="Win Rate"
        value={`${(portfolio?.win_rate ?? 0).toFixed(1)}%`}
        colorClass="text-accent-orange"
        loading={isLoading}
      />
      <StatCard
        label="Total P&L"
        value={formatPnl(portfolio?.pnl ?? 0)}
        colorClass={(portfolio?.pnl ?? 0) >= 0 ? "text-accent-green" : "text-accent-red"}
        loading={isLoading}
      />
      <StatCard
        label="Daily P&L"
        value={formatPnl(portfolio?.daily_pnl ?? 0)}
        colorClass={(portfolio?.daily_pnl ?? 0) >= 0 ? "text-accent-green" : "text-accent-red"}
        loading={isLoading}
      />
    </div>
  );
}
