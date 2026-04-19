import type {
  ApiResponse,
  Market,
  Signal,
  Trade,
  Portfolio,
  HealthStatus,
  ExecuteTradeBody,
  Position,
  ActivityEvent,
  DetailedHealth,
  LiveEventsPayload,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Unknown API error");
  }

  return json.data;
}

export async function fetchMarkets(params?: { page?: number; limit?: number; search?: string }): Promise<{
  data: Market[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  const path = qs ? `/markets?${qs}` : "/markets";

  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Unknown API error");
  return { data: json.data, total: json.total, page: json.page, limit: json.limit, pages: json.pages };
}

export async function fetchMarketSearch(q: string, limit = 20): Promise<Market[]> {
  const res = await fetch(`${API_URL}/markets/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Unknown API error");
  return json.data;
}

export async function fetchSignals(): Promise<Signal[]> {
  return fetchApi<Signal[]>("/signals");
}

export async function fetchTrades(): Promise<Trade[]> {
  return fetchApi<Trade[]>("/trades");
}

export async function fetchPortfolio(): Promise<Portfolio> {
  return fetchApi<Portfolio>("/portfolio");
}

export async function fetchHealth(): Promise<HealthStatus> {
  return fetchApi<HealthStatus>("/health");
}

export async function executeTrade(body: ExecuteTradeBody): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/trades/execute", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function toggleBot(active: boolean): Promise<{ auto_trade: boolean }> {
  return fetchApi<{ auto_trade: boolean }>("/bot/toggle", {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}

export async function setTradingMode(paperMode: boolean): Promise<{ paper_mode: boolean }> {
  return fetchApi<{ paper_mode: boolean }>("/config/mode", {
    method: "POST",
    body: JSON.stringify({ paper_mode: paperMode }),
  });
}

export async function fetchPositions(): Promise<Position[]> {
  return fetchApi<Position[]>("/positions");
}

export async function closePosition(marketId: string): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>(`/positions/${encodeURIComponent(marketId)}/close`, {
    method: "POST",
  });
}

export async function fetchLiveEvents(): Promise<LiveEventsPayload> {
  return fetchApi<LiveEventsPayload>("/events/live");
}

export async function fetchActivity(limit = 100, type = ""): Promise<ActivityEvent[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (type) params.set("type", type);
  return fetchApi<ActivityEvent[]>(`/activity?${params.toString()}`);
}

export async function fetchDetailedHealth(): Promise<DetailedHealth> {
  return fetchApi<DetailedHealth>("/health/detailed");
}

export async function resetPaperTrading(): Promise<{ balance: number; message: string }> {
  return fetchApi<{ balance: number; message: string }>("/paper/reset", {
    method: "POST",
  });
}

export async function exportPaperData(): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/paper/export");
}

export async function depositPaper(amount: number): Promise<{ balance: number; total_deposited: number }> {
  return fetchApi<{ balance: number; total_deposited: number }>("/paper/deposit", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function withdrawPaper(amount: number): Promise<{ balance: number; total_withdrawn: number }> {
  return fetchApi<{ balance: number; total_withdrawn: number }>("/paper/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function fetchTransactions(): Promise<Record<string, unknown>[]> {
  return fetchApi<Record<string, unknown>[]>("/paper/transactions");
}

export async function fetchRegimes(): Promise<{ data: RegimeEntry[]; counts: Record<string, number> }> {
  const res = await fetch(`${API_URL}/regimes`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Unknown API error");
  return { data: json.data, counts: json.counts };
}

export async function fetchCalibration(): Promise<CalibrationStats> {
  return fetchApi<CalibrationStats>("/calibration");
}

export interface RegimeEntry {
  market_id: string;
  question: string;
  regime: string;
  yes_price: number;
  no_price: number;
  volume: number;
}

export interface CalibrationStats {
  by_strategy: Record<string, CalibrationGroup>;
  by_regime: Record<string, CalibrationGroup>;
  by_category: Record<string, CalibrationGroup>;
}

export interface CalibrationGroup {
  total_trades: number;
  edge_accuracy: number;
  avg_estimated_edge: number;
  avg_realised_edge: number;
  cost_drag: number;
  net_expectancy: number;
}

export async function fetchStrategyConfigs(): Promise<Record<string, Record<string, unknown>>> {
  return fetchApi<Record<string, Record<string, unknown>>>("/strategies/config");
}

export async function updateStrategyConfig(strategy: string, config: Record<string, unknown>): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/strategies/config", {
    method: "POST",
    body: JSON.stringify({ strategy, settings: config }),
  });
}

export async function resetStrategyConfigs(): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/strategies/config/reset", { method: "POST" });
}

export async function fetchRiskConfig(): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/risk/config");
}

export async function updateRiskConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/risk/config", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function fetchConservativeMode(): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/conservative");
}

export async function toggleConservativeMode(enabled: boolean): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/conservative", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

export async function login(password: string): Promise<{ token: string; expires_at: string; role: string }> {
  return fetchApi<{ token: string; expires_at: string; role: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function logout(): Promise<void> {
  await fetchApi<Record<string, unknown>>("/auth/logout", { method: "POST" });
}

export async function getSession(): Promise<{ authenticated: boolean; role: string }> {
  return fetchApi<{ authenticated: boolean; role: string }>("/auth/session");
}

export async function fetchViewers(): Promise<Record<string, unknown>[]> {
  return fetchApi<Record<string, unknown>[]>("/viewers");
}

export async function fetchAuditLog(limit = 100): Promise<Record<string, unknown>[]> {
  return fetchApi<Record<string, unknown>[]>(`/audit?limit=${limit}`);
}
