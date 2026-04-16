"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const RISK_PARAMS = [
  { name: "Max Position Size", value: "5% of balance per trade" },
  { name: "Max Daily Drawdown", value: "10%" },
  { name: "Min Edge Threshold", value: "5%" },
  { name: "Min Confidence", value: "65%" },
  { name: "Default Mode", value: "Paper Trading" },
];

export function RiskTable() {
  return (
    <Card className="p-5">
      <div className="mb-3 text-sm font-semibold">Risk Management</div>
      <Separator className="mb-3" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {RISK_PARAMS.map((p) => (
          <div key={p.name} className="flex items-center justify-between border-b border-border/50 py-1.5">
            <span className="text-[10px] text-muted-foreground">{p.name}</span>
            <span className="text-[11px] font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
