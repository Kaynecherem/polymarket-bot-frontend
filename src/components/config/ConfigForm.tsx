"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHealth } from "@/hooks/use-health";
import { setTradingMode } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ConfigForm() {
  const { data: health } = useHealth();
  const queryClient = useQueryClient();

  const paperMode = health?.paper_mode ?? true;
  const autoTrade = health?.auto_trade ?? false;

  const handleModeSwitch = async (checked: boolean) => {
    if (autoTrade) {
      toast.error("Stop the bot before switching trading modes");
      return;
    }
    try {
      await setTradingMode(checked);
      queryClient.invalidateQueries({ queryKey: ["health"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success(checked ? "Switched to Paper mode" : "Switched to Live mode");
    } catch (err) {
      toast.error(`Failed to switch mode: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  };

  return (
    <Card className="max-w-xl p-5">
      <div className="mb-4 text-sm font-semibold">Trading Mode</div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label className="text-sm font-semibold">
              {paperMode ? "Paper Trading" : "Live Trading"}
            </Label>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {paperMode
                ? "Simulated trades with virtual balance. No real money at risk."
                : "Real trades on Polymarket. Using your funded wallet."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-bold uppercase ${
                paperMode ? "text-accent-orange" : "text-accent-red"
              }`}
            >
              {paperMode ? "PAPER" : "LIVE"}
            </span>
            <Switch
              checked={paperMode}
              onCheckedChange={handleModeSwitch}
              disabled={autoTrade}
            />
          </div>
        </div>

        {autoTrade && (
          <p className="text-[10px] text-accent-orange">
            Stop the bot before switching between paper and live mode.
          </p>
        )}

        {!paperMode && (
          <div className="rounded-lg border border-accent-red/30 bg-accent-red/5 p-3">
            <p className="text-[11px] font-semibold text-accent-red">Live Mode Active</p>
            <p className="mt-1 text-[10px] text-accent-red/80">
              The bot is trading with real funds on Polygon. Trades execute against the
              Polymarket CLOB using your wallet. Monitor closely.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
