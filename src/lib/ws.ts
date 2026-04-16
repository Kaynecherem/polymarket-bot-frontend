import type { WsMessage, ConnectionStatus } from "./types";

const WS_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws")
  : "";

type MessageHandler = (msg: WsMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private _status: ConnectionStatus = "disconnected";
  private _destroyed = false;

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status;
    this.statusHandlers.forEach((h) => h(status));
  }

  connect(): void {
    if (this._destroyed || !WS_URL) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.setStatus("connected");
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        const data = event.data as string;
        if (data === "pong") return;
        try {
          const msg: WsMessage = JSON.parse(data);
          this.messageHandlers.forEach((h) => h(msg));
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus("disconnected");
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.setStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this._destroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  private scheduleReconnect(): void {
    if (this._destroyed) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), this.maxReconnectDelay);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }
}
