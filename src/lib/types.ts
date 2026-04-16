export interface Market {
  id: string;
  question: string;
  category: string;
  yes_price: number;
  no_price: number;
  volume: number;
  liquidity: number;
  end_date: string;
  active: boolean;
  tokens?: Token[];
  price_history?: PricePoint[];
}

export interface Token {
  token_id: string;
  outcome: string;
  price: number;
}

export interface PricePoint {
  timestamp: number;
  yes_price: number;
  no_price: number;
}

export interface Signal {
  market_id: string;
  strategy: string;
  side: "yes" | "no";
  edge: number;
  confidence: number;
  rationale: string;
  question?: string;
  detected_at?: number;
}

export interface Trade {
  id: number;
  timestamp: number;
  market_id: string;
  market_question: string;
  strategy: string;
  side: string;
  price: number;
  size_usdc: number;
  order_id: string;
  pnl: number;
  paper_mode: number;
  tier?: string;
  close_reason?: string;
  closed_at?: string;
  hold_duration_seconds?: number;
  entry_slippage?: number;
  fee_paid?: number;
  take_profit_price?: number;
  stop_loss_price?: number;
  edge_at_entry?: number;
  confidence_at_entry?: number;
  rationale?: string;
  entry_price?: number;
  exit_price?: number;
}

export interface AuditSummary {
  starting_balance: number;
  cash_from_ledger: number;
  tied_up_in_positions: number;
  realized_gained: number;
  realized_lost: number;
  realized_net: number;
  return_pct: number;
  closes_total: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  legacy_partial_closes: number;
  paper_state_balance: number;
  ledger_vs_state_delta: number;
  nav: number;
}

export interface Portfolio {
  balance: number;
  pnl: number;
  positions: number;
  win_rate: number;
  daily_pnl: number;
  paper_mode: boolean;
  strategy_performance?: Record<string, Record<string, number>>;
  realised_pnl?: number;
  unrealised_pnl?: number;
  open_positions?: Position[];
  initial_balance?: number;
  total_deposited?: number;
  total_withdrawn?: number;
  net_deposits?: number;
  absolute_return?: number;
  return_pct?: number;
  audit?: AuditSummary;
}

export interface HealthStatus {
  status: string;
  paper_mode: boolean;
  version: string;
  auto_trade: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export interface WsMessage {
  type: "market_update" | "signal_update" | "trade_update" | "portfolio_update" | "initial_snapshot" | "activity_event" | "circuit_breaker";
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ExecuteTradeBody {
  market_id: string;
  signal_id: string;
  action: "buy" | "skip";
}

export interface PartialClose {
  level: number;
  size: number;
  price: number;
  pnl: number;
  timestamp: string;
}

export interface Position {
  market_id: string;
  question: string;
  side: "yes" | "no";
  strategy: string;
  entry_price: number;
  current_price: number;
  size_usdc: number;
  original_size?: number;
  scale_out_level?: number;
  partial_closes?: PartialClose[];
  realised_partial_pnl?: number;
  adjusted_stop_loss_pct?: number | null;
  unrealised_pnl: number;
  unrealised_pnl_pct: number;
  opened_at: string;
  duration_minutes: number;
  take_profit_price: number;
  stop_loss_price: number;
  distance_to_tp_pct: number;
  distance_to_sl_pct: number;
  tier: "scalp" | "swing";
  max_hold_time: string;
  auto_close_at: string;
  time_remaining: string;
  edge_at_entry?: number;
  current_edge?: number;
  peak_edge?: number;
  regime_at_entry?: string;
  is_live_event?: boolean;
  live_event_at_entry?: boolean;
}

export interface LiveEventMarket {
  market_id: string;
  question: string;
  category: string;
  yes_price: number;
  since: string;
  duration_seconds: number;
}

export interface LiveEventsPayload {
  live_markets: LiveEventMarket[];
  counts: {
    live_event?: number;
    pre_event?: number;
    post_event?: number;
    normal?: number;
  };
  clusters: Array<{
    market_id: string;
    started_at: number;
    trades_used: number;
    closes_in_window: number;
  }>;
}

export interface ActivityEvent {
  timestamp: string;
  type: string;
  level: "info" | "warning" | "error";
  message: string;
  details: Record<string, unknown>;
}

export interface DetailedHealth {
  memory_mb: number;
  markets_cached: number;
  markets_trading: number;
  price_history_points: number;
  open_positions: number;
  ws_clients: number;
  trading_universe_count: number;
  active_strategies: string[];
  drawdown_guard_active: boolean;
  drawdown_guard_reason: string | null;
  last_signal_scan_at: string | null;
  last_market_tick_at: string | null;
  signals_this_cycle: number;
  llm_calls_today: number;
  cooldowns_active: number;
}

export type Strategy = "arbitrage" | "reversion" | "sentiment";
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface SystemLogEntry {
  id: string;
  time: string;
  text: string;
  type: "signal" | "trade" | "error" | "bot";
}
