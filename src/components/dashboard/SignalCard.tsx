"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STRATEGY_META } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { Signal, Market, Strategy } from "@/lib/types";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SignalCardProps {
  signal: Signal;
  market?: Market;
  onBuy?: () => void;
  onSkip?: () => void;
}

export function SignalCard({ signal, market, onBuy, onSkip }: SignalCardProps) {
  const meta = STRATEGY_META[signal.strategy as Strategy];
  const badgeVariant = signal.strategy === "arbitrage" ? "green" as const
    : signal.strategy === "sentiment" ? "blue" as const
    : "orange" as const;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-accent-green/25 bg-accent-green/[0.03] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {market?.category || "Market"}
          </span>
          <Badge variant={badgeVariant}>{meta?.label || signal.strategy}</Badge>
        </div>

        <p className="mb-3 text-xs font-medium leading-relaxed">
          {signal.question || market?.question || signal.market_id}
        </p>

        {market && (
          <div className="mb-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-accent-green" />
              <span className="text-accent-green font-semibold">{formatPrice(market.yes_price)}</span>
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-accent-red" />
              <span className="text-accent-red font-semibold">{formatPrice(market.no_price)}</span>
            </span>
          </div>
        )}

        <div className="mb-3 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-muted-foreground">Edge: </span>
            <span className="font-semibold">{(signal.edge * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Confidence: </span>
            <span className="font-semibold">{(signal.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Side: </span>
            <span className={`font-semibold uppercase ${signal.side === "yes" ? "text-accent-green" : "text-accent-red"}`}>
              {signal.side}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="success" size="sm" className="flex-1" onClick={onBuy}>
            BUY {signal.side.toUpperCase()}
          </Button>
          <Button variant="muted" size="sm" className="flex-1" onClick={onSkip}>
            SKIP
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
