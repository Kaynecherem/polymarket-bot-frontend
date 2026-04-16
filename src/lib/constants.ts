import type { Strategy } from "./types";

export const STRATEGY_META: Record<Strategy, { label: string; color: string; className: string }> = {
  arbitrage: {
    label: "Arbitrage",
    color: "hsl(154 100% 50%)",
    className: "text-accent-green bg-accent-green/10 border-accent-green/30",
  },
  reversion: {
    label: "Reversion",
    color: "hsl(40 100% 50%)",
    className: "text-accent-orange bg-accent-orange/10 border-accent-orange/30",
  },
  sentiment: {
    label: "Sentiment",
    color: "hsl(224 100% 73%)",
    className: "text-accent-blue bg-accent-blue/10 border-accent-blue/30",
  },
};

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { key: "markets", label: "Markets", href: "/markets", icon: "TrendingUp" },
  { key: "strategies", label: "Strategies", href: "/strategies", icon: "Brain" },
  { key: "trades", label: "Trades", href: "/trades", icon: "ArrowLeftRight" },
  { key: "config", label: "Config", href: "/config", icon: "Settings" },
] as const;

export const DEFAULT_API_URL = "http://localhost:8000/api";
export const DEFAULT_WS_URL = "ws://localhost:8000/ws";
