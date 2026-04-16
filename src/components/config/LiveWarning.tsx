import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function LiveWarning() {
  return (
    <Card className="max-w-xl border-accent-red/30 bg-accent-red/[0.03] p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent-red">
        <AlertTriangle className="h-4 w-4" />
        Live Trading Warning
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Live trading involves real financial risk. You can lose some or all of your funds.
        Always start with paper mode to test your strategies. Never trade with funds you
        cannot afford to lose. The bot authors are not responsible for any financial losses.
        Ensure you understand the risks of prediction markets and automated trading before
        enabling live mode.
      </p>
    </Card>
  );
}
