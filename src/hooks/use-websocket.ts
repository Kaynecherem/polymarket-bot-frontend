"use client";

import { useEffect, useState } from "react";
import { useWsContext } from "@/providers/websocket-provider";
import type { ConnectionStatus } from "@/lib/types";

export function useWebSocket(): ConnectionStatus {
  const { status } = useWsContext();
  return status;
}
