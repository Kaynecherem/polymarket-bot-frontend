"use client";

import dynamic from "next/dynamic";

const MoneyTrailContent = dynamic(
  () => import("@/components/money-trail/MoneyTrailContent"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    ),
  }
);

export default function MoneyTrailPage() {
  return <MoneyTrailContent />;
}
