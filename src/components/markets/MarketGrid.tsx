"use client";

import { useState } from "react";
import { MarketCard } from "./MarketCard";
import { OrderPanel } from "./OrderPanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { Market, Signal } from "@/lib/types";

interface MarketGridProps {
  markets: Market[];
  signals: Signal[];
  loading?: boolean;
}

export function MarketGrid({ markets, signals, loading }: MarketGridProps) {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const getSignalForMarket = (marketId: string): Signal | undefined =>
    signals.find((s) => s.market_id === marketId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!markets.length) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No markets available
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {markets.map((market, i) => (
          <MarketCard
            key={market.id}
            market={market}
            signal={getSignalForMarket(market.id)}
            onClick={() => setSelectedMarket(market)}
            index={i}
          />
        ))}
      </div>

      <OrderPanel
        market={selectedMarket}
        signal={selectedMarket ? getSignalForMarket(selectedMarket.id) : undefined}
        open={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
      />
    </>
  );
}
