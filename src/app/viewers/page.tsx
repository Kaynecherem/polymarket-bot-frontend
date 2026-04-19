"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { fetchViewers, fetchAuditLog } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

type Tab = "viewers" | "audit";

export default function ViewersPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("viewers");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, authLoading, router]);

  const { data: viewers, isLoading: viewersLoading } = useQuery({
    queryKey: ["viewers"],
    queryFn: fetchViewers,
    refetchInterval: 10_000,
    enabled: isAdmin && tab === "viewers",
  });

  const { data: auditLog, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => fetchAuditLog(100),
    refetchInterval: 10_000,
    enabled: isAdmin && tab === "audit",
  });

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold uppercase tracking-wider">Viewers & Audit</h1>
        <div className="flex gap-1">
          <Button
            variant={tab === "viewers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("viewers")}
          >
            Viewers
          </Button>
          <Button
            variant={tab === "audit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("audit")}
          >
            Audit Log
          </Button>
        </div>
      </div>

      {tab === "viewers" && (
        <Card className="p-4">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Live Viewers
          </div>
          {viewersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
          ) : !viewers || viewers.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No active viewers
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-0">
                <div className="mb-2 grid grid-cols-5 gap-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>IP</span>
                  <span>Device</span>
                  <span>Current Page</span>
                  <span>Duration</span>
                  <span>Status</span>
                </div>
                {viewers.map((v, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 gap-2 border-b border-border/50 py-2 text-[11px]"
                  >
                    <span className="font-mono text-muted-foreground">
                      {String(v.ip || v.address || "Unknown")}
                    </span>
                    <span className="truncate">
                      {String(v.device || v.user_agent || "Unknown")}
                    </span>
                    <span className="truncate">
                      {String(v.page || v.current_page || "/")}
                    </span>
                    <span className="text-muted-foreground">
                      {String(v.duration || v.connected_for || "-")}
                    </span>
                    <span>
                      <Badge
                        variant={v.status === "active" || v.active ? "green" : "secondary"}
                        className="text-[8px]"
                      >
                        {String(v.status || (v.active ? "active" : "idle"))}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      )}

      {tab === "audit" && (
        <Card className="p-4">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Audit Log
          </div>
          {auditLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 rounded" />
              ))}
            </div>
          ) : !auditLog || auditLog.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No audit entries
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-0">
                <div className="mb-2 grid grid-cols-4 gap-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Timestamp</span>
                  <span>Action</span>
                  <span>User</span>
                  <span>Details</span>
                </div>
                {auditLog.map((entry, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-2 border-b border-border/50 py-1.5 text-[11px]"
                  >
                    <span className="font-mono text-muted-foreground">
                      {String(entry.timestamp || entry.time || "-")}
                    </span>
                    <span className="font-semibold">
                      {String(entry.action || entry.type || "-")}
                    </span>
                    <span className="text-muted-foreground">
                      {String(entry.user || entry.ip || "-")}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {String(entry.details || entry.message || "-")}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      )}
    </div>
  );
}
