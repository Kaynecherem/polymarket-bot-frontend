"use client";

import dynamic from "next/dynamic";

const StrategiesContent = dynamic(() => import("@/components/strategies/StrategiesContent"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-48 rounded-lg bg-muted animate-pulse" />
    </div>
  ),
});

export default function StrategiesPage() {
  return <StrategiesContent />;
}
