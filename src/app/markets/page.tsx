"use client";

import dynamic from "next/dynamic";

const MarketsContent = dynamic(() => import("@/components/markets/MarketsContent"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="h-9 w-80 rounded-md bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  ),
});

export default function MarketsPage() {
  return <MarketsContent />;
}
