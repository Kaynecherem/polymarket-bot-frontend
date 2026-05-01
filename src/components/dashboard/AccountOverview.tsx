"use client";

import { usePortfolio } from "@/hooks/use-portfolio";
import { usePositions } from "@/hooks/use-positions";
import { useHealth } from "@/hooks/use-health";
import { StatCard } from "./StatCard";
import { formatCurrency, formatPnl, formatPercentage } from "@/lib/utils";
import { useSignals } from "@/hooks/use-signals";
import { ResetButton } from "./ResetButton";
import { AdminOnly } from "@/components/ui/admin-only";

export function AccountOverview() {
  const { data: portfolio, isLoading } = usePortfolio();
  const { data: positions } = usePositions();
  const { data: signals } = useSignals();
  const { data: health } = useHealth();
  const paperMode = health?.paper_mode ?? true;

  const balance = portfolio?.balance ?? 0;
  // `locked` from the API is the wider of (bot-tracked) and
  // (Polymarket-wide open exposure) so live-mode shows the real number,
  // including positions the bot didn't open. Fall back to summing the
  // positions list (paper mode and pre-rollout safety).
  const locked = portfolio?.locked
    ?? (positions ?? []).reduce((s, p) => s + p.size_usdc, 0);
  const unrealisedPnl = portfolio?.unrealised_pnl ?? 0;
  const realisedPnl = portfolio?.realised_pnl ?? 0;
  const nav = balance + locked;
  const initial = portfolio?.initial_balance ?? 0;
  const netVsDeposited = nav - initial;
  const dailyPnl = portfolio?.daily_pnl ?? 0;
  const winRate = portfolio?.win_rate ?? 0;
  const totalTrades = portfolio?.positions ?? 0;
  const openCount = portfolio?.polymarket_open_count ?? (positions ?? []).length;
  const cashLabel = paperMode ? "Cash Balance" : "pUSD Cash";
  const lockedLabel = paperMode ? "Locked" : `Open Exposure (${openCount})`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Account Overview</span>
        {paperMode && (
          <AdminOnly>
            <ResetButton />
          </AdminOnly>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-9">
        <StatCard label={cashLabel} value={formatCurrency(balance)} loading={isLoading} />
        <StatCard label={lockedLabel} value={formatCurrency(locked)} colorClass="text-accent-blue" loading={isLoading} />
        <StatCard label="NAV" value={formatCurrency(nav)} loading={isLoading} />
        <StatCard
          label="Net vs Deposited"
          value={formatPnl(netVsDeposited)}
          colorClass={netVsDeposited >= 0 ? "text-accent-green" : "text-accent-red"}
          loading={isLoading}
        />
        <StatCard
          label="Realised P&L"
          value={formatPnl(realisedPnl)}
          colorClass={realisedPnl >= 0 ? "text-accent-green" : "text-accent-red"}
          loading={isLoading}
        />
        <StatCard
          label="Today's P&L (24h)"
          value={formatPnl(dailyPnl)}
          colorClass={dailyPnl >= 0 ? "text-accent-green" : "text-accent-red"}
          loading={isLoading}
        />
        <StatCard
          label="Unrealised P&L"
          value={formatPnl(unrealisedPnl)}
          colorClass={unrealisedPnl >= 0 ? "text-accent-green" : "text-accent-red"}
          loading={isLoading}
        />
        <StatCard label="Win Rate" value={formatPercentage(winRate)} colorClass="text-accent-orange" loading={isLoading} />
        <StatCard label="Total Trades" value={totalTrades} loading={isLoading} />
      </div>
    </div>
  );
}
