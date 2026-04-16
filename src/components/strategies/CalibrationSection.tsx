"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCalibration } from "@/lib/api";
import type { CalibrationGroup } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function CalibrationRow({ name, stats }: { name: string; stats: CalibrationGroup }) {
  const accuracyColor = stats.edge_accuracy >= 50 ? "text-accent-green" : "text-accent-red";
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-1.5 text-[11px]">
      <span className="font-medium capitalize">{name.replace("_", " ")}</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground">Accuracy </span>
          <span className={`font-semibold ${accuracyColor}`}>{stats.edge_accuracy.toFixed(0)}%</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground">Est </span>
          <span>{(stats.avg_estimated_edge * 100).toFixed(1)}%</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground">Real </span>
          <span className={stats.avg_realised_edge >= 0 ? "text-accent-green" : "text-accent-red"}>
            {(stats.avg_realised_edge * 100).toFixed(1)}%
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground">Cost </span>
          <span className="text-accent-red">{(stats.cost_drag * 100).toFixed(2)}%</span>
        </div>
        <div className="w-8 text-right text-muted-foreground">{stats.total_trades}</div>
      </div>
    </div>
  );
}

export function CalibrationSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["calibration"],
    queryFn: fetchCalibration,
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-40 rounded-lg" />;

  const byStrategy = data?.by_strategy ?? {};
  const byRegime = data?.by_regime ?? {};

  const hasData = Object.keys(byStrategy).length > 0 || Object.keys(byRegime).length > 0;
  if (!hasData) {
    return (
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Calibration</div>
        <div className="text-[11px] text-muted-foreground">No calibration data yet. Trades will be tracked after positions close.</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold mb-1">Calibration</div>
      <div className="text-[9px] text-muted-foreground mb-3">
        Edge accuracy: % of trades where net edge (after costs) was positive
      </div>

      {Object.keys(byStrategy).length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">By Strategy</div>
          {Object.entries(byStrategy).map(([name, stats]) => (
            <CalibrationRow key={name} name={name} stats={stats} />
          ))}
        </div>
      )}

      {Object.keys(byRegime).length > 0 && (
        <div>
          <Separator className="my-2" />
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">By Regime</div>
          {Object.entries(byRegime).map(([name, stats]) => (
            <CalibrationRow key={name} name={name} stats={stats} />
          ))}
        </div>
      )}
    </Card>
  );
}
