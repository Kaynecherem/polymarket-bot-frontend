"use client";

import { usePortfolio } from "@/hooks/use-portfolio";
import { usePositions } from "@/hooks/use-positions";
import { useHealth } from "@/hooks/use-health";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAppStore } from "@/stores/app-store";
import { toggleBot as toggleBotApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPnl } from "@/lib/utils";
import { Moon, Sun, Menu, TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";

export function Header() {
  const { data: portfolio } = usePortfolio();
  const { data: positions } = usePositions();
  const { data: health } = useHealth();
  const wsStatus = useWebSocket();
  const { toggleSidebar } = useAppStore();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const botActive = health?.auto_trade ?? false;

  const handleToggleBot = () => {
    const next = !botActive;
    toggleBotApi(next)
      .then(() => queryClient.invalidateQueries({ queryKey: ["health"] }))
      .catch((err) => console.error("Failed to toggle bot:", err));
  };

  const balance = portfolio?.balance ?? 0;
  const locked = (positions ?? []).reduce((s, p) => s + p.size_usdc, 0);
  const totalPnl = (portfolio?.realised_pnl ?? 0) + (portfolio?.unrealised_pnl ?? 0);
  const paperMode = portfolio?.paper_mode ?? true;

  // Bot status — derived from backend health poll, not local state
  let statusDot = "bg-muted-foreground";
  let statusText = "STOPPED";
  if (wsStatus === "connecting") {
    statusDot = "bg-muted-foreground animate-pulse";
    statusText = "CONNECTING...";
  } else if (botActive) {
    statusDot = "bg-accent-green shadow-[0_0_8px_hsl(var(--accent-green))] animate-pulse_dot";
    statusText = "RUNNING";
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${statusDot}`} />
                <span className="hidden text-[9px] font-medium text-muted-foreground sm:inline">
                  {statusText}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Bot: {statusText} | WS: {wsStatus}</TooltipContent>
          </Tooltip>
          <span className="hidden text-sm font-bold tracking-widest sm:inline">POLYMARKET BOT</span>
          <Badge variant="secondary" className="hidden text-[9px] sm:inline-flex">v2.0</Badge>
          {paperMode && <Badge variant="orange">Paper</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-5 sm:flex">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Cash</div>
            <div className="text-xs font-semibold">{formatCurrency(balance)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Locked</div>
            <div className="text-xs font-semibold text-accent-blue">{formatCurrency(locked)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">P&L</div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
              {totalPnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPnl(totalPnl)}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button
          variant={botActive ? "destructive" : "success"}
          size="sm"
          onClick={handleToggleBot}
        >
          {botActive ? "STOP BOT" : "START BOT"}
        </Button>
      </div>
    </header>
  );
}
