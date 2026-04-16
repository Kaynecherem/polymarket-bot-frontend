"use client";

import dynamic from "next/dynamic";

const DashboardContent = dynamic(() => import("@/components/dashboard/DashboardContent"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-9">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 h-64 rounded-lg bg-muted animate-pulse" />
        <div className="lg:col-span-2 h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardContent />;
}
