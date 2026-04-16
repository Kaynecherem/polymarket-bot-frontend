"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "./PriceChart";
import { STRATEGY_META } from "@/lib/constants";
import { formatPrice, formatCompact } from "@/lib/utils";
import type { Market, Signal, Strategy } from "@/lib/types";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarketCardProps {
  market: Market;
  signal?: Signal;
  onClick?: () => void;
  index?: number;
}

function MarketCardInner({ market, signal, onClick, index = 0 }: MarketCardProps) {
  const history = market.price_history || [];
  const recent = history.slice(-20);
  const prev = recent.length > 1 ? recent[recent.length - 2]?.yes_price : null;
  const trend = prev !== null
    ? market.yes_price > prev ? "up" : market.yes_price < prev ? "down" : "flat"
    : "flat";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-accent-green" : trend === "down" ? "text-accent-red" : "text-muted-foreground";

  const badgeVariant = signal
    ? signal.strategy === "arbitrage" ? "green" as const
      : signal.strategy === "sentiment" ? "blue" as const
      : "orange" as const
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card
        className={`cursor-pointer p-4 transition-colors hover:border-[hsl(var(--border))]/60 ${
          signal ? "border-accent-green/25 bg-accent-green/[0.03]" : ""
        }`}
        onClick={onClick}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {market.category}
          </span>
          {signal && badgeVariant && (
            <Badge variant={badgeVariant}>
              {STRATEGY_META[signal.strategy as Strategy]?.label || signal.strategy}
            </Badge>
          )}
        </div>

        <p className="mb-3 min-h-[2.5rem] text-xs font-medium leading-relaxed">
          {market.question}
        </p>

        <div className="mb-3 flex items-center gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground">YES </span>
            <span className="text-base font-bold text-accent-green">
              {formatPrice(market.yes_price)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">NO </span>
            <span className="text-base font-bold text-accent-red">
              {formatPrice(market.no_price)}
            </span>
          </div>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>

        <div className="mb-2">
          <PriceChart data={recent} height={40} />
        </div>

        <div className="flex gap-4 text-[10px] text-muted-foreground">
          <span>Vol: {formatCompact(market.volume)}</span>
          <span>Liq: {formatCompact(market.liquidity)}</span>
        </div>
      </Card>
    </motion.div>
  );
}

export const MarketCard = React.memo(MarketCardInner, (prev, next) => {
  return (
    prev.market.yes_price === next.market.yes_price &&
    prev.market.no_price === next.market.no_price &&
    prev.signal?.market_id === next.signal?.market_id &&
    prev.market.id === next.market.id
  );
});
