/**
 * Cross-page data-correlation tests.
 *
 * Loads each operator-facing page in a real browser, extracts the numbers
 * displayed in cards/tables, and asserts the same field reads the same
 * value everywhere it's surfaced. Catches the class of bug where the
 * frontend hits multiple endpoints and the cards no longer agree.
 *
 * Numbers are extracted by visible heading/label text, not by data-testid,
 * because the components don't have testids today and the user's bug
 * reports are about what's *visible* on screen.
 */
import { test, expect, Page } from "@playwright/test";

const API = process.env.API_BASE_URL ?? "http://localhost:18000";

async function fetchJson(path: string): Promise<any> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return await res.json();
}

/** Pull a number from the StatCard whose label matches `labelText`.
 *  Resilient to slow client-side hydration: scrolls into view, waits for
 *  any in-card skeleton to disappear, then reads the sibling value. */
async function readStatCard(page: Page, labelText: string): Promise<string> {
  // Escape regex meta-chars in the label since it can contain '&', '(', etc.
  const escaped = labelText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const labelLocator = page
    .getByText(new RegExp(`^${escaped}$`, "i"))
    .first();
  await labelLocator.waitFor({ state: "attached", timeout: 30000 });
  await labelLocator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  await labelLocator.waitFor({ state: "visible", timeout: 30000 });
  // Walk up to the closest container (the StatCard root) and read its
  // full text; subtract the label to get the value (+ any sub-line).
  const card = labelLocator.locator(
    "xpath=ancestor::*[self::div or self::section][1]"
  );
  const all = (await card.innerText()).trim();
  return all.replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
}

function parseNum(s: string): number {
  // Strip $, %, +, , and similar; parse the first number-like token.
  const m = s.replace(/[$,+\s]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

test.describe("Cross-page data correlation", () => {
  test("Dashboard 'Total Trades' matches /trades row count and matches portfolio.positions", async ({
    page,
  }) => {
    const portfolio = (await fetchJson("/api/portfolio")).data;
    const trades = (await fetchJson("/api/trades")).data as any[];

    // Source of truth: portfolio.positions (now total cycles after the audit fix)
    expect(
      trades.length,
      "/api/trades row count should equal portfolio.positions"
    ).toBe(portfolio.positions);

    // Dashboard
    await page.goto("/dashboard");
    const dashTotal = parseNum(await readStatCard(page, "Total Trades"));
    expect(
      dashTotal,
      `Dashboard 'Total Trades' (${dashTotal}) should match portfolio.positions (${portfolio.positions})`
    ).toBe(portfolio.positions);

    // Trades page
    await page.goto("/trades");
    const tradesTotal = parseNum(await readStatCard(page, "Total Trades"));
    expect(
      tradesTotal,
      `Trades page 'Total Trades' (${tradesTotal}) should match Dashboard (${dashTotal})`
    ).toBe(dashTotal);
  });

  test("Win rate matches across Dashboard, Trades page, and portfolio.win_rate", async ({
    page,
  }) => {
    const portfolio = (await fetchJson("/api/portfolio")).data;
    const expected = Number(portfolio.win_rate ?? 0);

    await page.goto("/dashboard");
    const dashWR = parseNum(await readStatCard(page, "Win Rate"));
    expect(Math.abs(dashWR - expected)).toBeLessThan(0.2);

    await page.goto("/trades");
    const tradesWR = parseNum(await readStatCard(page, "Win Rate"));
    expect(Math.abs(tradesWR - expected)).toBeLessThan(0.2);
    expect(Math.abs(tradesWR - dashWR)).toBeLessThan(0.2);
  });

  test("Realised P&L matches across Dashboard, Trades page, and portfolio.pnl", async ({
    page,
  }) => {
    // Same number, different labels: Dashboard's AccountOverview shows it
    // as "Realised P&L"; Trades page TradeSummary shows it as "Total P&L".
    // Both source from portfolio.pnl (which is summary.total_pnl in the
    // engine — realised only).
    const portfolio = (await fetchJson("/api/portfolio")).data;
    const expected = Number(portfolio.pnl ?? 0);

    await page.goto("/dashboard");
    const dashPnl = parseNum(await readStatCard(page, "Realised P&L"));
    expect(Math.abs(dashPnl - expected)).toBeLessThan(0.05);

    await page.goto("/trades");
    const tradesPnl = parseNum(await readStatCard(page, "Total P&L"));
    expect(Math.abs(tradesPnl - expected)).toBeLessThan(0.05);
    expect(Math.abs(tradesPnl - dashPnl)).toBeLessThan(0.05);
  });

  test("Sum of closed-trade-row pnls matches portfolio.realised_pnl", async ({
    request,
  }) => {
    // Re-asserts H1 at the API level but framed as a cross-field consistency
    // check the operator can correlate by eye.
    const portfolio = (await fetchJson("/api/portfolio")).data;
    const trades = (await fetchJson("/api/trades")).data as any[];
    const closedSum = trades
      .filter((t) => t.is_terminal === true || (t.is_open === false && !!t.closed_at))
      .reduce((acc, t) => acc + Number(t.pnl ?? 0), 0);
    expect(Math.abs(closedSum - Number(portfolio.realised_pnl)))
      .toBeLessThan(0.05);
  });

  test("Open positions count matches across PositionsTable, /api/positions, and portfolio.open_count", async ({
    page,
  }) => {
    const portfolio = (await fetchJson("/api/portfolio")).data;
    const positions = (await fetchJson("/api/positions")).data as any[];
    expect(positions.length).toBe(portfolio.open_count);

    await page.goto("/dashboard");
    // PositionsTable header reads "Open Positions (N)" — case-insensitive
    // because the component uses CSS uppercase, which leaks into innerText.
    const header = page.getByText(/open positions \(\d+\)/i).first();
    await header.waitFor({ state: "visible", timeout: 30000 });
    await header.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    const txt = await header.innerText();
    const m = txt.match(/open positions \((\d+)\)/i);
    const dashOpen = m ? Number(m[1]) : NaN;
    expect(
      dashOpen,
      `Dashboard PositionsTable header (${dashOpen}, raw='${txt}') should match /api/positions length (${positions.length})`
    ).toBe(positions.length);
  });

  test("Money trail current_tradeable balance matches portfolio.balance (live mode)", async ({
    page,
  }) => {
    const health = (await fetchJson("/api/health")).data;
    test.skip(!!health.paper_mode, "paper mode — money trail uses different sources");

    const portfolio = (await fetchJson("/api/portfolio")).data;
    const mt = (await fetchJson("/api/money-trail")).data;

    // Money trail composes tradeable from pUSD + USDC.e + native USDC.
    // portfolio.balance in live mode is on-chain pUSD only. So MT >= portfolio.balance.
    const mtTradeable = Number(mt.summary?.current_tradeable ?? 0);
    const portBalance = Number(portfolio.balance ?? 0);
    expect(
      mtTradeable,
      `Money trail current_tradeable ($${mtTradeable}) should be >= portfolio.balance ($${portBalance})`
    ).toBeGreaterThanOrEqual(portBalance - 0.5);
    // And not absurdly higher (caps at sum of three on-chain reads)
    expect(mtTradeable - portBalance).toBeLessThan(50000);
  });

  test("Cash ledger drift is non-zero when ledger fold and on-chain disagree", async ({
    request,
  }) => {
    const health = (await fetchJson("/api/health")).data;
    test.skip(!!health.paper_mode, "paper mode — drift is paper-only");

    const cl = (await fetchJson("/api/cash-ledger")).data;
    const ledger = Number(cl.ledger_balance);
    const onChain = Number(cl.on_chain_balance);
    const drift = Number(cl.drift);
    // Sanity: drift is the signed difference. If ledger==onChain, drift==0.
    expect(Math.abs(drift - (ledger - onChain))).toBeLessThan(0.05);
    console.log(
      `[drift signal] ledger=${ledger} on_chain=${onChain} drift=${drift}`
    );
  });

  test("Strategy performance close counts sum to portfolio.closed_count", async () => {
    const portfolio = (await fetchJson("/api/portfolio")).data;
    const perf = portfolio.strategy_performance ?? {};
    const totalCloses = Object.values(perf).reduce(
      (acc: number, s: any) => acc + Number(s?.closed_count ?? s?.total ?? 0),
      0
    );
    expect(totalCloses).toBe(portfolio.closed_count);
  });

  test("Wallet positions: every is_bot_tracked row matches an open engine position by token_id", async () => {
    const health = (await fetchJson("/api/health")).data;
    test.skip(!!health.paper_mode, "paper mode — /wallet-positions returns []");

    const wallet = (await fetchJson("/api/wallet-positions")).data as any[];
    const positions = (await fetchJson("/api/positions")).data as any[];
    const botTokenIds = new Set(positions.map((p) => p.token_id).filter(Boolean));

    if (wallet.length === 0) {
      test.skip(true, "wallet-positions empty — data-api may be lagging");
    }

    for (const w of wallet) {
      if (w.is_bot_tracked) {
        expect(
          botTokenIds.has(w.asset_id),
          `Wallet row marked is_bot_tracked but asset_id ${w.asset_id} not in engine open positions`
        ).toBe(true);
      }
    }
    // Note: the reverse direction (every engine position -> wallet row) is
    // intentionally NOT asserted. /wallet-positions filters rows below
    // size=0.01 tokens, so a cycle stuck in 'closing' with dust quantity
    // (0.00254 tokens, like the migrated Iran position) won't have a wallet
    // row even though the engine still tracks it. That's a separate issue
    // about residual-dust auto-close on the backend, not an is_bot_tracked
    // identity mismatch.
  });
});
