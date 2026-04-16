"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-0.5">
      <div className="h-full bg-accent-green animate-progress" />
    </div>
  );
}
