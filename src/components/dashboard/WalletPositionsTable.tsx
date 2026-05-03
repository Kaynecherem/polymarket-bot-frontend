"use client";

import { useWalletPositions } from "@/hooks/use-wallet-positions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatCurrency, truncate, cn } from "@/lib/utils";

/**
 * Wallet-wide positions, including ones the bot didn't open (V1 stranded
 * holdings, manual trades, anything that isn't in the bot's positions table).
 * Read-only — actions on bot-tracked positions still go through PositionsTable.
 *
 * Why this exists: PositionsTable shows only `live_manager.get_open_positions`,
 * which excludes the ~6 V1-era unresolved positions sitting on the wallet
 * (~$120 of $193 open exposure as of 2026-05-01). Without this card, those
 * positions are invisible until they resolve — partner asks "where's my
 * money tied up?" and the dashboard answer is incomplete.
 */
export function WalletPositionsTable() {
  const { data, isLoading } = useWalletPositions();

  if (isLoading) {
    return <Skeleton className="h-64 rounded-lg" />;
  }

  const items = data?.rows ?? [];
  const v1HiddenCount = data?.v1_hidden_count ?? 0;
  const v1HiddenValue = data?.v1_hidden_value ?? 0;

  // If there are no V2 rows AND no hidden V1 rows, hide the card entirely.
  // If V2 rows are empty but V1 dust exists, still render the small
  // disclosure footer so the operator knows it's there.
  if (items.length === 0 && v1HiddenCount === 0) {
    return null;
  }

  const totalValue = items.reduce((s, p) => s + p.current_value, 0);
  const totalPnl = items.reduce((s, p) => s + p.pnl, 0);
  const openCount = items.filter((p) => !p.redeemable && p.current_value > 0.01).length;
  const redeemableCount = items.filter((p) => p.redeemable && p.current_value > 0.01).length;

  // V2-only: empty V2 + hidden V1 dust — render compact disclosure card.
  if (items.length === 0 && v1HiddenCount > 0) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium uppercase tracking-wider text-muted-foreground">
            Wallet Positions (V2)
          </span>
          <span className="text-muted-foreground/70">
            None tracked. {v1HiddenCount} V1 legacy {v1HiddenCount === 1 ? "position" : "positions"} (
            {formatCurrency(v1HiddenValue)} face value) hidden — pre-migration dust,
            auto-redeems when Polymarket&apos;s resolver settles each market.
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Wallet Positions (V2) ({items.length})
        </span>
        <div className="flex gap-2 text-[9px]">
          {openCount > 0 && (
            <span className="rounded border border-accent-blue/40 px-2 py-0.5 text-accent-blue">
              {openCount} open
            </span>
          )}
          {redeemableCount > 0 && (
            <span className="rounded border border-accent-green/40 px-2 py-0.5 text-accent-green">
              {redeemableCount} redeemable
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="max-h-[480px]">
        <div className="space-y-0">
          <div className="mb-2 grid grid-cols-7 gap-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="col-span-2">Market</span>
            <span>Side</span>
            <span>Avg / Now</span>
            <span>Value</span>
            <span>P&L</span>
            <span>Status</span>
          </div>
          {items.map((p) => {
            const pnlColor = p.pnl >= 0 ? "text-accent-green" : "text-accent-red";
            const sideIsYes = p.side === "Yes" || p.outcome_index === 0;
            return (
              <div
                key={`${p.condition_id}-${p.asset_id}`}
                className="grid grid-cols-7 gap-2 border-b border-border/50 py-2 text-[11px]"
              >
                <div className="col-span-2 flex flex-col gap-0.5">
                  <span className="truncate" title={p.title}>{truncate(p.title, 40)}</span>
                  <div className="flex flex-wrap gap-0.5">
                    {p.is_bot_tracked && (
                      <Badge variant="green" className="w-fit text-[8px]">BOT</Badge>
                    )}
                    {p.negative_risk && (
                      <Badge variant="secondary" className="w-fit text-[8px]" title="Neg-risk market — different redemption path">
                        NEG
                      </Badge>
                    )}
                  </div>
                </div>
                <span>
                  <Badge variant={sideIsYes ? "green" : "red"} className="text-[9px]">
                    {p.side.toUpperCase()}
                  </Badge>
                </span>
                <div className="flex flex-col text-[10px]">
                  <span>{formatPrice(p.avg_price)}</span>
                  <span className="text-muted-foreground">{formatPrice(p.current_price)}</span>
                </div>
                <div className="flex flex-col text-[10px]">
                  <span className="font-mono">{formatCurrency(p.current_value)}</span>
                  <span className="text-[9px] text-muted-foreground line-through font-mono">
                    {formatCurrency(p.initial_value)}
                  </span>
                </div>
                <div className={`flex flex-col font-mono ${pnlColor}`}>
                  <span className="font-semibold">{p.pnl >= 0 ? "+" : ""}{formatCurrency(p.pnl)}</span>
                  <span className="text-[9px]">{p.pnl_pct >= 0 ? "+" : ""}{p.pnl_pct.toFixed(1)}%</span>
                </div>
                <div className="flex items-center">
                  <Badge
                    variant={
                      p.status === "Redeemable" ? "green"
                      : p.status === "Resolved" ? "secondary"
                      : "blue"
                    }
                    className={cn(
                      "text-[9px]",
                      p.status === "Redeemable" && "animate-pulse"
                    )}
                    title={
                      p.status === "Redeemable"
                        ? "Auto-redeemed by hourly sweep — no action needed"
                        : p.status === "Resolved"
                        ? "Market resolved against this side (worth $0)"
                        : "Market still open, position carrying forward"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground border-t border-border pt-2">
        <span>Total value: {formatCurrency(totalValue)}</span>
        <span className={totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}>
          Unrealised: {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
        </span>
        <span className="text-muted-foreground/70">
          V2 / post-migration only — bot-managed positions
        </span>
        {v1HiddenCount > 0 && (
          <span className="text-muted-foreground/60 italic">
            +{v1HiddenCount} V1 legacy hidden ({formatCurrency(v1HiddenValue)} face value, auto-redeems on resolution)
          </span>
        )}
      </div>
    </Card>
  );
}
