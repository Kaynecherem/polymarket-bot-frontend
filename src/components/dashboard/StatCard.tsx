"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
  loading?: boolean;
}

export function StatCard({ label, value, sub, colorClass = "text-foreground", loading }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setDisplayValue(value);
      prevRef.current = value;
    }
  }, [value]);

  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-2 h-3 w-20" />
        <Skeleton className="mb-1 h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <motion.div
        key={String(value)}
        initial={{ opacity: 0.6, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mt-1 text-xl font-bold ${colorClass}`}
      >
        {displayValue}
      </motion.div>
      {sub && (
        <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>
      )}
    </Card>
  );
}
