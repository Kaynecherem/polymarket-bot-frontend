"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WebSocketManager } from "@/lib/ws";
import type { ConnectionStatus, WsMessage } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

interface WsContextValue {
  status: ConnectionStatus;
  manager: WebSocketManager | null;
}

const WsContext = createContext<WsContextValue>({
  status: "disconnected",
  manager: null,
});

export function useWsContext() {
  return useContext(WsContext);
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const managerRef = useRef<WebSocketManager | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const prevStatusRef = useRef<ConnectionStatus>("disconnected");

  // Stable ref for addLogEntry so it doesn't cause effect re-runs
  const addLogEntryRef = useRef(useAppStore.getState().addLogEntry);
  useEffect(() => {
    return useAppStore.subscribe((state) => {
      addLogEntryRef.current = state.addLogEntry;
    });
  }, []);

  useEffect(() => {
    const mgr = new WebSocketManager();
    managerRef.current = mgr;

    const unsub1 = mgr.onStatusChange((s) => {
      setStatus(s);
      if (s === "connected" && prevStatusRef.current === "disconnected") {
        toast.success("WebSocket connected");
        queryClient.invalidateQueries();
      } else if (s === "disconnected" && prevStatusRef.current === "connected") {
        toast.error("WebSocket disconnected — falling back to polling");
      }
      prevStatusRef.current = s;
    });

    const unsub2 = mgr.onMessage((msg: WsMessage) => {
      switch (msg.type) {
        case "market_update":
          queryClient.invalidateQueries({ queryKey: ["markets"] });
          break;
        case "signal_update":
          queryClient.invalidateQueries({ queryKey: ["signals"] });
          if (Array.isArray(msg.data) && msg.data.length > 0) {
            addLogEntryRef.current({
              text: `${msg.data.length} signal(s) detected`,
              type: "signal",
            });
          }
          break;
        case "trade_update":
          queryClient.invalidateQueries({ queryKey: ["trades"] });
          queryClient.invalidateQueries({ queryKey: ["portfolio"] });
          addLogEntryRef.current({ text: "Trade executed", type: "trade" });
          toast.success("Trade executed successfully");
          break;
        case "portfolio_update":
          queryClient.invalidateQueries({ queryKey: ["portfolio"] });
          break;
        case "initial_snapshot":
          queryClient.invalidateQueries({ queryKey: ["markets"] });
          queryClient.invalidateQueries({ queryKey: ["signals"] });
          break;
        case "activity_event":
          queryClient.invalidateQueries({ queryKey: ["activity"] });
          queryClient.invalidateQueries({ queryKey: ["positions"] });
          break;
      }
    });

    mgr.connect();

    return () => {
      unsub1();
      unsub2();
      mgr.disconnect();
    };
  }, [queryClient]); // Only queryClient — stable singleton, never changes

  return (
    <WsContext.Provider value={{ status, manager: managerRef.current }}>
      {children}
    </WsContext.Provider>
  );
}
