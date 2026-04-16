"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";
import type { PricePoint } from "@/lib/types";

interface PriceChartProps {
  data: PricePoint[];
  height?: number;
  showAxis?: boolean;
  color?: string;
}

export function PriceChart({ data, height = 60, showAxis = false, color = "hsl(154, 100%, 50%)" }: PriceChartProps) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-[10px] text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = data.map((p) => ({
    time: new Date(p.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    price: p.yes_price,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showAxis && (
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: "hsl(0 0% 67%)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
        )}
        <RechartsTooltip
          contentStyle={{
            background: "hsl(0 0% 5.1%)",
            border: "1px solid hsl(0 0% 12%)",
            borderRadius: 6,
            fontSize: 10,
            fontFamily: "monospace",
          }}
          labelStyle={{ color: "hsl(0 0% 67%)" }}
          formatter={(value: number) => [`${(value * 100).toFixed(1)}¢`, "Price"]}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill="url(#priceGradient)"
          dot={false}
          animationDuration={300}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
