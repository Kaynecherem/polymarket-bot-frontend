"use client";

import { AccountOverview } from "@/components/dashboard/AccountOverview";
import { AuditCard } from "@/components/dashboard/AuditCard";
import { PositionsTable } from "@/components/dashboard/PositionsTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { LiveEventsPanel } from "@/components/dashboard/LiveEventsPanel";
import { StrategyPerformance } from "@/components/dashboard/StrategyPerformance";
import { ConcentrationIndicator } from "@/components/dashboard/ConcentrationIndicator";
import { MarketRegimes } from "@/components/dashboard/MarketRegimes";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { useSignals } from "@/hooks/use-signals";
import { useMarkets } from "@/hooks/use-markets";
import { executeTrade } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { Signal } from "@/lib/types";

export default function DashboardContent() {
  const { data: signals, isLoading: signalsLoading } = useSignals();
  const { data: marketsResult } = useMarkets({ limit: 50 });
  const markets = marketsResult?.data ?? [];
  const queryClient = useQueryClient();
  const addLogEntry = useAppStore((s) => s.addLogEntry);

  const signalMarkets = (signals || [])
    .map((sig) => {
      const market = (markets || []).find((m) => m.id === sig.market_id);
      return { signal: sig, market };
    })
    .filter((x) => x.market);

  const handleTrade = async (signal: Signal, action: "buy" | "skip") => {
    try {
      await executeTrade({
        market_id: signal.market_id,
        signal_id: signal.market_id,
        action,
      });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      addLogEntry({
        text: action === "buy"
          ? `Trade: BUY ${signal.side.toUpperCase()} "${(signal.question || "").slice(0, 40)}..."`
          : `Skipped: "${(signal.question || "").slice(0, 40)}..."`,
        type: action === "buy" ? "trade" : "signal",
      });
      toast.success(action === "buy" ? "Trade executed!" : "Signal skipped");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      addLogEntry({ text: `Error: ${err instanceof Error ? err.message : "Trade failed"}`, type: "error" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      {/* Section 1: Account Overview */}
      <AccountOverview />

      {/* Section 1b: Audit Card — ledger-derived source of truth */}
      <AuditCard />

      {/* Section 2 + 3: Positions + Strategy Performance + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <MarketRegimes />
          <PositionsTable />
          <StrategyPerformance />
          <ConcentrationIndicator />

          {/* Active Signals */}
          {signalsLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 rounded-lg" />
              ))}
            </div>
          ) : signalMarkets.length > 0 ? (
            <div>
              <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Signals ({signalMarkets.length})
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {signalMarkets.slice(0, 12).map(({ signal, market }) => (
                  <SignalCard
                    key={signal.market_id}
                    signal={signal}
                    market={market}
                    onBuy={() => handleTrade(signal, "buy")}
                    onSkip={() => handleTrade(signal, "skip")}
                  />
                ))}
              </div>
              {signalMarkets.length > 12 && (
                <div className="mt-2 text-center">
                  <a href="/markets" className="text-xs text-accent-green hover:underline">
                    View all {signalMarkets.length} signals →
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <LiveEventsPanel />
          <ActivityFeed />
        </div>
      </div>
    </motion.div>
  );
}
