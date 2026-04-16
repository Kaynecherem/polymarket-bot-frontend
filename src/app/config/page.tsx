"use client";

import dynamic from "next/dynamic";

const ConfigContent = dynamic(() => import("@/components/config/ConfigContent"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="h-64 max-w-xl rounded-lg bg-muted animate-pulse" />
      <div className="h-40 max-w-xl rounded-lg bg-muted animate-pulse" />
      <div className="h-48 max-w-xl rounded-lg bg-muted animate-pulse" />
    </div>
  ),
});

export default function ConfigPage() {
  return <ConfigContent />;
}
