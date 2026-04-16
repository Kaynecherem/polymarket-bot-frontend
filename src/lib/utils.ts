import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPnl(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${formatCurrency(value)}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatPrice(value: number): string {
  return `${(value * 100).toFixed(1)}¢`;
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString();
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}
