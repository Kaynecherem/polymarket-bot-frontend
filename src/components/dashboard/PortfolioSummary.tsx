"use client";

import { usePortfolio } from "@/hooks/use-portfolio";
import { StatCard } from "./StatCard";
import { useSignals } from "@/hooks/use-signals";
import { formatPnl, formatPercentage } from "@/lib/utils";

export function PortfolioSummary() {
  const { data: portfolio, isLoading } = usePortfolio();
  const { data: signals } = useSignals();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Active Signals"
        value={signals?.length ?? 0}
        colorClass="text-accent-blue"
        loading={isLoading}
      />
      <StatCard
        label="Total Trades"
        value={portfolio?.positions ?? 0}
        loading={isLoading}
      />
      <StatCard
        label="Win Rate"
        value={formatPercentage(portfolio?.win_rate ?? 0)}
        colorClass="text-accent-orange"
        loading={isLoading}
      />
      <StatCard
        label="Total P&L"
        value={formatPnl(portfolio?.pnl ?? 0)}
        colorClass={(portfolio?.pnl ?? 0) >= 0 ? "text-accent-green" : "text-accent-red"}
        loading={isLoading}
      />
    </div>
  );
}
