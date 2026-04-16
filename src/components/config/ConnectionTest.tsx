"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchHealth } from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export function ConnectionTest() {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const wsStatus = useWebSocket();

  const test = useCallback(async () => {
    setTesting(true);
    try {
      const data = await fetchHealth();
      setResult({
        success: true,
        message: `Connected! Status: ${data.status}, Paper: ${data.paper_mode}, v${data.version}`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
    setTesting(false);
  }, []);

  return (
    <Card className="max-w-xl p-5">
      <div className="mb-4 text-sm font-semibold">Connection Status</div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">REST API</span>
          <div className={`h-2 w-2 rounded-full ${result?.success ? "bg-accent-green" : result === null ? "bg-muted-foreground" : "bg-accent-red"}`} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">WebSocket</span>
          {wsStatus === "connected" ? (
            <Wifi className="h-3 w-3 text-accent-green" />
          ) : wsStatus === "connecting" ? (
            <Loader2 className="h-3 w-3 animate-spin text-accent-orange" />
          ) : (
            <WifiOff className="h-3 w-3 text-accent-red" />
          )}
          <span className="text-[10px] text-muted-foreground">{wsStatus}</span>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={test} disabled={testing}>
        {testing ? "Testing..." : "Test Connection"}
      </Button>

      {result && (
        <div className={`mt-3 rounded-md border p-3 text-[11px] ${
          result.success
            ? "border-accent-green/30 bg-accent-green/5 text-accent-green"
            : "border-accent-red/30 bg-accent-red/5 text-accent-red"
        }`}>
          {result.message}
        </div>
      )}
    </Card>
  );
}
