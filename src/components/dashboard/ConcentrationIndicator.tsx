"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ConcentrationData {
  max_pct: number;
  max_event: string;
  status: "green" | "orange" | "red";
  events: Record<string, { count: number; pnl: number }>;
}

async function fetchConcentration(): Promise<ConcentrationData> {
  const res = await fetch(`${API_URL}/concentration`);
  if (!res.ok) throw new Error("Failed to fetch concentration");
  const json = await res.json();
  return json.data;
}

export function ConcentrationIndicator() {
  const { data } = useQuery({
    queryKey: ["concentration"],
    queryFn: fetchConcentration,
    refetchInterval: 30_000,
  });

  if (!data || Object.keys(data.events).length === 0) return null;

  const statusColor =
    data.status === "red"
      ? "text-accent-red"
      : data.status === "orange"
        ? "text-accent-orange"
        : "text-accent-green";

  const badgeVariant =
    data.status === "red"
      ? ("destructive" as const)
      : data.status === "orange"
        ? ("orange" as const)
        : ("green" as const);

  return (
    <Card className="px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Concentration
        </span>
        <Badge variant={badgeVariant}>
          {data.status === "green"
            ? "Diversified"
            : data.status === "orange"
              ? "Moderate"
              : "High Risk"}
        </Badge>
      </div>
      {data.max_event && data.max_pct > 0.10 && (
        <div className="mt-1 text-[9px] text-muted-foreground">
          Top event: <span className={statusColor}>{data.max_event}</span>{" "}
          — {(data.max_pct * 100).toFixed(0)}% of activity
        </div>
      )}
    </Card>
  );
}
