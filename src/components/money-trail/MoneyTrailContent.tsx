"use client";

import { useMoneyTrail } from "@/hooks/use-money-trail";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPnl, cn, truncate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const CATEGORY_COLORS: Record<string, { text: string; bg: string; badge: "red" | "orange" | "blue" | "secondary" }> = {
  "Trading Loss": { text: "text-accent-red", bg: "bg-accent-red", badge: "red" },
  "Ghost Position": { text: "text-purple-400", bg: "bg-purple-500", badge: "secondary" },
  "Too Small to Sell": { text: "text-accent-orange", bg: "bg-accent-orange", badge: "orange" },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] || { text: "text-muted-foreground", bg: "bg-muted-foreground", badge: "secondary" as const };
}

export default function MoneyTrailContent() {
  const { data, isLoading, error } = useMoneyTrail();

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-accent-red">
        Failed to load money trail: {error.message}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const { current_balances, trading_pnl, losses_breakdown, summary, wallet_address } = data;
  // fees_breakdown is the per-trade fee attribution added 2026-05-04
  // so "Recorded Trading Fees: -$67.85" stops being a faceless lump.
  const fees_breakdown = (data as unknown as { fees_breakdown?: Array<{
    id: number;
    time: string;
    market: string;
    strategy: string;
    size: number;
    fee_usdc: number;
    fee_basis: string;
    category: string;
  }> }).fees_breakdown ?? [];
  const reconciliation = (data as unknown as { reconciliation?: {
    starting_deposit: number;
    net_trade_pnl: number;
    current_nav: number;
    expected_nav: number;
    unaccounted_gap: number;
    explanation: string;
  } }).reconciliation;

  // Build the "where money went" breakdown bars
  const s = summary as Record<string, number>;
  const breakdownItems = [
    { label: "Ghost Positions (orders never filled)", amount: summary.lost_to_infrastructure, color: "bg-purple-500" },
    { label: "Polymarket Token Fees (deducted from fills)", amount: s.lost_to_token_fees ?? 0, color: "bg-orange-500" },
    { label: "QuickSwap Swap Slippage", amount: summary.lost_to_swap_slippage, color: "bg-yellow-500" },
    { label: "Trading Losses (strategy)", amount: Math.abs(trading_pnl.total_lost), color: "bg-accent-red" },
    { label: "Unclosed Positions (tokens expired worthless)", amount: s.lost_to_unclosed ?? 0, color: "bg-pink-500" },
    // NOTE: Spread Cost is informational. It's the gap between fill
    // price and midpoint, already implicit in the trade's P&L through
    // the fill price. Showing it as a bar alongside "Trading Losses"
    // could imply additivity to operators. Excluded from the bar
    // chart for that reason; surfaced separately as 'Spread Cost by
    // Trade' below with a clear explanation.
    { label: "Execution Slippage (fill price vs recorded)", amount: s.lost_to_execution_slippage ?? 0, color: "bg-zinc-600" },
    { label: "Trading Gains (offsets losses above)", amount: trading_pnl.total_gained, color: "bg-accent-green" },
  ].filter((item) => item.amount > 0.005);

  const maxBreakdown = Math.max(...breakdownItems.map((b) => b.amount), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* Section 1: Where Is My Money Now */}
      <div>
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Where Is My Money Now
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              pUSD (tradeable cash)
            </div>
            <div className="mt-1 text-xl font-bold text-accent-green">
              {formatCurrency(current_balances.pusd ?? 0)}
            </div>
            <div className="mt-1 text-[9px] text-muted-foreground/70">
              V2 trading collateral
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Open Position Value
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {formatCurrency(current_balances.open_position_value ?? 0)}
            </div>
            <div className="mt-1 text-[9px] text-muted-foreground/70">
              {current_balances.open_position_count ?? 0} unresolved markets
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Stray (USDC.e + native)
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {formatCurrency((current_balances.usdc_e ?? 0) + (current_balances.native_usdc ?? 0))}
            </div>
            {((current_balances.usdc_e ?? 0) + (current_balances.native_usdc ?? 0)) > 0.01 && (
              <div className="mt-1 text-[9px] text-accent-orange/70">
                Auto-wraps to pUSD on next bot restart
              </div>
            )}
          </Card>
          <Card className="p-4 ring-1 ring-accent-green/30">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              NAV (cash + open exposure)
            </div>
            <div className="mt-1 text-xl font-bold text-accent-green">
              {formatCurrency(current_balances.total)}
            </div>
          </Card>
        </div>
      </div>

      {/* Section 2: Profit & Loss Summary */}
      <div>
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Profit & Loss Summary
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Trading P&L (closed trades)
            </div>
            <div className={cn(
              "mt-1 text-2xl font-bold",
              trading_pnl.net >= 0 ? "text-accent-green" : "text-accent-red"
            )}>
              {formatPnl(trading_pnl.net)}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {trading_pnl.wins}W / {trading_pnl.losses}L — {trading_pnl.win_rate}% WR
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Net vs Deposited (NAV − initial)
            </div>
            {(() => {
              const net = current_balances.total - summary.total_deposited_tradeable;
              return (
                <div className={cn(
                  "mt-1 text-2xl font-bold",
                  net >= 0 ? "text-accent-green" : "text-accent-red"
                )}>
                  {formatPnl(net)}
                </div>
              );
            })()}
            <div className="mt-1 text-[10px] text-muted-foreground">
              {formatCurrency(current_balances.total)} now vs {formatCurrency(summary.total_deposited_tradeable)} initial
            </div>
          </Card>
        </div>
      </div>

      {/* Section 3: Where The Money Went */}
      {breakdownItems.length > 0 && (
        <div>
          <h2 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Where The Money Went
          </h2>
          <Card className="p-4 space-y-3">
            {breakdownItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{item.label}</span>
                  <span className="text-xs font-mono font-medium text-accent-red">
                    -{formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", item.color)}
                    style={{ width: `${Math.max((item.amount / maxBreakdown) * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Section 4: Every Loss, Line by Line */}
      <div>
        <h2 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Every Loss, Line by Line ({losses_breakdown.length})
        </h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Market</th>
                  <th className="px-3 py-2">Strategy</th>
                  <th className="px-3 py-2 text-right">Size</th>
                  <th className="px-3 py-2 text-right">P&L</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {losses_breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No losses recorded
                    </td>
                  </tr>
                ) : (
                  losses_breakdown.map((loss) => {
                    const style = getCategoryStyle(loss.category);
                    return (
                      <tr
                        key={loss.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-muted-foreground">
                          {loss.time}
                        </td>
                        <td className="px-3 py-2 max-w-[200px]" title={loss.market}>
                          {truncate(loss.market, 45)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{loss.strategy}</td>
                        <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                          {formatCurrency(loss.size)}
                        </td>
                        <td className={cn(
                          "px-3 py-2 text-right font-mono font-medium whitespace-nowrap",
                          style.text
                        )}>
                          {formatPnl(loss.pnl)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={style.badge} className="text-[9px]">
                            {loss.category}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {loss.reason.replace(/_/g, " ")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Reconciliation card — answers "where did my money go" with a
          single signed equation: deposited + trades = expected. Any gap
          between expected and current NAV is what's unaccounted for
          (pre-migration V1 dust, redemption timing, settlement fees
          not captured in events). */}
      {reconciliation && (
        <div>
          <h2 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Reconciliation — Wallet Sources & Sinks
          </h2>
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Starting Deposit
                </div>
                <div className="mt-1 text-base font-bold tabular-nums">
                  {formatCurrency(reconciliation.starting_deposit)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Net Trade P&L (incl. fees)
                </div>
                <div
                  className={cn(
                    "mt-1 text-base font-bold tabular-nums",
                    reconciliation.net_trade_pnl >= 0 ? "text-accent-green" : "text-accent-red"
                  )}
                >
                  {formatPnl(reconciliation.net_trade_pnl)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Expected NAV
                </div>
                <div className="mt-1 text-base font-bold tabular-nums">
                  {formatCurrency(reconciliation.expected_nav)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Current NAV
                </div>
                <div className="mt-1 text-base font-bold tabular-nums">
                  {formatCurrency(reconciliation.current_nav)}
                </div>
              </div>
              <div className={cn(
                "rounded p-2 -m-2",
                Math.abs(reconciliation.unaccounted_gap) > 1
                  ? "ring-1 ring-accent-orange/40 bg-accent-orange/5"
                  : ""
              )}>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Unaccounted Gap
                </div>
                <div
                  className={cn(
                    "mt-1 text-base font-bold tabular-nums",
                    Math.abs(reconciliation.unaccounted_gap) > 1
                      ? "text-accent-orange"
                      : "text-muted-foreground"
                  )}
                  title={reconciliation.explanation}
                >
                  {formatPnl(-reconciliation.unaccounted_gap)}
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-border/50 pt-3 text-[10px] text-muted-foreground/80">
              {reconciliation.explanation}
            </div>
          </Card>
        </div>
      )}

      {/* Section 5: Every Spread Cost, Line by Line — answers "where
          did the fees come from?" with market-level attribution. NOTE:
          this is NOT a separate cash outflow on top of P&L. It's the
          spread between fill price and midpoint, already implicit in
          the trade's price. Surfaced here so operators can see WHERE
          their cash impact came from (price direction vs bad fill). */}
      {fees_breakdown.length > 0 && (
        <div>
          <h2 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Spread Cost by Trade ({fees_breakdown.length})
          </h2>
          <div className="mb-2 text-[10px] text-muted-foreground/80">
            Informational — this is the spread paid on entry/exit (fill price
            vs midpoint). It&apos;s already baked into the trade&apos;s P&amp;L
            via the fill price, NOT a separate fee on top. Use it to see how
            much of a trade&apos;s loss came from a bad fill vs price direction.
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Market</th>
                    <th className="px-3 py-2">Strategy</th>
                    <th className="px-3 py-2 text-right">Size</th>
                    <th className="px-3 py-2 text-right">Fee</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {fees_breakdown.map((row) => (
                    <tr
                      key={`fee-${row.id}`}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-muted-foreground">
                        {row.time}
                      </td>
                      <td className="px-3 py-2 max-w-[260px]" title={row.market}>
                        {truncate(row.market, 50)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.strategy}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                        {formatCurrency(row.size)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium whitespace-nowrap text-accent-orange">
                        -{formatCurrency(row.fee_usdc)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="orange" className="text-[9px]">
                          {row.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-[10px]">
                        {row.fee_basis === "spread"
                          ? "estimated from spread (fill vs midpoint)"
                          : "actual on-chain"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Polygonscan link */}
      {wallet_address && (
        <div className="pb-4 text-center">
          <a
            href={`https://polygonscan.com/address/${wallet_address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View wallet on Polygonscan
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </motion.div>
  );
}
