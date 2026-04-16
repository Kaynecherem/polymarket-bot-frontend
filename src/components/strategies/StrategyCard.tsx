"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface Param {
  name: string;
  value: string;
}

interface StrategyCardProps {
  name: string;
  description: string;
  color: string;
  params: Param[];
  enabled?: boolean;
  index?: number;
}

export function StrategyCard({ name, description, color, params, enabled = true, index = 0 }: StrategyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-sm font-semibold">{name}</span>
          </div>
          <Badge variant={enabled ? "green" : "secondary"}>
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{description}</p>

        <Separator className="mb-3" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {params.map((p) => (
            <div key={p.name} className="flex items-center justify-between border-b border-border/50 py-1.5">
              <span className="text-[10px] text-muted-foreground">{p.name}</span>
              <span className="text-[11px] font-medium">{p.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
