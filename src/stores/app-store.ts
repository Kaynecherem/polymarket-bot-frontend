import { create } from "zustand";
import { toggleBot as toggleBotApi, fetchHealth } from "@/lib/api";
import type { SystemLogEntry } from "@/lib/types";

interface AppState {
  botActive: boolean;
  sidebarOpen: boolean;
  systemLog: SystemLogEntry[];
  syncBotState: () => void;
  toggleBot: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addLogEntry: (entry: Omit<SystemLogEntry, "id" | "time">) => void;
  clearLog: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  botActive: false,
  sidebarOpen: true,
  systemLog: [],
  syncBotState: () => {
    fetchHealth()
      .then((health) => {
        set({ botActive: health.auto_trade });
      })
      .catch(() => {});
  },
  toggleBot: () => {
    const next = !get().botActive;
    // Fire and forget — update UI optimistically
    toggleBotApi(next).catch((err) => {
      console.error("Failed to toggle bot on backend:", err);
      // Revert on failure
      set({ botActive: !next });
    });
    set((state) => ({
      botActive: next,
      systemLog: [
        {
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString(),
          text: next ? "Bot started — auto-trading enabled" : "Bot stopped — auto-trading disabled",
          type: "bot" as const,
        },
        ...state.systemLog,
      ].slice(0, 50),
    }));
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addLogEntry: (entry) =>
    set((state) => ({
      systemLog: [
        {
          ...entry,
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString(),
        },
        ...state.systemLog,
      ].slice(0, 50),
    })),
  clearLog: () => set({ systemLog: [] }),
}));
