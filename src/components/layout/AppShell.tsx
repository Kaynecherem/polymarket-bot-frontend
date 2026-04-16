"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAppStore } from "@/stores/app-store";
import { useWebSocket } from "@/hooks/use-websocket";
import { NAV_ITEMS } from "@/lib/constants";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toggleBot = useAppStore((s) => s.toggleBot);
  const syncBotState = useAppStore((s) => s.syncBotState);
  const wsStatus = useWebSocket();

  // Sync bot state from backend on mount
  useEffect(() => {
    syncBotState();
  }, [syncBotState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Cmd/Ctrl + 1-5 for tab switching
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        e.preventDefault();
        router.push(NAV_ITEMS[num - 1].href);
        return;
      }

      // Cmd/Ctrl + B to toggle bot
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        toggleBot();
        return;
      }
    };

    const escHandler = (e: KeyboardEvent) => {
      // Escape closes any open sheets/panels (handled by Radix natively)
      // but we can add custom behavior here if needed
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("keydown", escHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keydown", escHandler);
    };
  }, [router, toggleBot]);

  return (
    <div className="flex h-screen flex-col">
      <Header />
      {/* WS disconnect banner */}
      {wsStatus === "disconnected" && (
        <div className="bg-accent-red/10 border-b border-accent-red/30 px-4 py-1.5 text-center text-[11px] text-accent-red">
          WebSocket disconnected — falling back to polling
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
