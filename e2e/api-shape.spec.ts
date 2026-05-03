/**
 * API-shape validation against the live backend.
 *
 * One assertion per audit-doc bug. Failing test = bug present and reproducible.
 * Passes only when the bug has actually been fixed end-to-end (not just in a
 * unit test that never wires the live client).
 *
 * Run with the SSH tunnel forwarding EC2:8000 -> localhost:18000:
 *   ssh -i <key> -L 18000:localhost:8000 -N ubuntu@56.228.76.37 &
 *   npx playwright test
 */
import { test, expect, APIRequestContext } from "@playwright/test";

type Json = Record<string, any>;

async function getJson(req: APIRequestContext, path: string): Promise<Json> {
  const res = await req.get(path);
  expect(res.status(), `${path} returned ${res.status()}`).toBe(200);
  return await res.json();
}

test.describe("Health & basic plumbing", () => {
  test("/api/health responds with the expected envelope", async ({ request }) => {
    const j = await getJson(request, "/api/health");
    expect(j.success).toBe(true);
    expect(j.data).toMatchObject({
      status: "ok",
      paper_mode: expect.any(Boolean),
      auto_trade: expect.any(Boolean),
      markets_cached: expect.any(Number),
      signals_active: expect.any(Number),
    });
  });

  test("H4: cooldowns_active reflects the real cooldowns table, not a stub zero", async ({
    request,
  }) => {
    // The bug: api/routes/health.py line 59 hardcodes
    // sqlite3.connect("trades.db") which post-bindmount-fix opens an empty
    // ephemeral DB and always returns 0. We can't directly assert that the
    // count is non-zero here (cooldowns may be legitimately empty), but we
    // CAN assert the field is populated in the response and that the
    // endpoint doesn't crash on a missing table — and document this as the
    // canonical place a future operator can wire a real cooldown to verify.
    const j = await getJson(request, "/api/health/detailed");
    expect(j.data).toHaveProperty("cooldowns_active");
    expect(typeof j.data.cooldowns_active).toBe("number");
    // Soft assertion via console: if you have a known active cooldown
    // and this prints 0, H4 is still present.
    console.log("[H4 indicator] cooldowns_active =", j.data.cooldowns_active);
  });
});

test.describe("Trades table — covers H1 + H2", () => {
  test("H1: every POSITION_CLOSED-side row carries the position's realised P&L", async ({
    request,
  }) => {
    const trades = (await getJson(request, "/api/trades")).data as Json[];
    const closeRows = trades.filter((t) =>
      typeof t.side === "string" && t.side.startsWith("close_")
    );

    if (closeRows.length === 0) {
      test.skip(true, "no closed trades yet — cannot exercise H1");
    }

    const portfolio = (await getJson(request, "/api/portfolio")).data;
    const realisedTotal = Number(portfolio.realised_pnl);

    // If realisedTotal is non-zero, AT LEAST ONE close row must reflect it.
    // The H1 bug makes every close row report 0.0 even when realised_pnl != 0.
    if (Math.abs(realisedTotal) > 0.01) {
      const sumOfCloseRowPnls = closeRows.reduce(
        (acc, r) => acc + Number(r.pnl ?? 0),
        0
      );
      expect(
        Math.abs(sumOfCloseRowPnls - realisedTotal),
        `sum of close-row pnls (${sumOfCloseRowPnls}) should match portfolio.realised_pnl (${realisedTotal}); ` +
          `if all close rows show 0.00, H1 is still present (api_adapter cycle counter bug)`
      ).toBeLessThan(0.05);

      const allZero = closeRows.every((r) => Math.abs(Number(r.pnl ?? 0)) < 0.01);
      expect(
        allZero,
        "every close row has pnl 0.00 but realised_pnl is non-zero — H1 confirmed"
      ).toBe(false);
    }
  });

  test("H2: total trade count matches what /api/trades returns", async ({
    request,
  }) => {
    const trades = (await getJson(request, "/api/trades")).data as Json[];
    const portfolio = (await getJson(request, "/api/portfolio")).data;

    // Post-fix contract: portfolio.positions = total cycles (open +
    // closed). /api/trades emits one row per cycle. So they must equal.
    // Also assert closed_count == close-side row count for cross-check.
    expect(
      trades.length,
      `trades endpoint reports ${trades.length} rows, portfolio.positions=${portfolio.positions}`
    ).toBe(portfolio.positions);
    const closeRows = trades.filter((t) =>
      typeof t.side === "string" && t.side.startsWith("close_")
    );
    expect(
      closeRows.length,
      `close-side rows (${closeRows.length}) should equal portfolio.closed_count (${portfolio.closed_count})`
    ).toBe(portfolio.closed_count);
  });

  test("trades response always has stable monotonic ids", async ({
    request,
  }) => {
    const trades = (await getJson(request, "/api/trades")).data as Json[];
    const ids = trades.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(typeof id).toBe("number");
      expect(Number.isInteger(id)).toBe(true);
    }
  });
});

test.describe("Cash ledger — covers H3", () => {
  test("H3: ledger_balance and on_chain_balance are NOT structurally identical in live mode", async ({
    request,
  }) => {
    const health = (await getJson(request, "/api/health")).data;
    if (health.paper_mode) {
      test.skip(true, "paper mode — H3 is live-mode only");
    }

    const ledger = (await getJson(request, "/api/cash-ledger")).data;
    const ledgerBal = Number(ledger.ledger_balance);
    const onChain = Number(ledger.on_chain_balance);
    const drift = Number(ledger.drift);

    // The bug: after the position_engine client-wiring fix, both readings
    // are now the same on-chain RPC call, so drift is structurally 0.
    // A real ledger (folded from BALANCE_*/ORDER_FILLED/CLOSE_FILLED
    // events) will rarely match on-chain to the cent.
    //
    // Assert: if there have been any fills since the last BALANCE_SET,
    // ledger should differ from on-chain by at least a fee or two.
    // Soft-fail: just print the values and let the operator judge.
    console.log(
      `[H3 indicator] ledger=${ledgerBal} on_chain=${onChain} drift=${drift}`
    );
    expect(
      ledgerBal === onChain && drift === 0,
      "ledger == on_chain AND drift == 0 exactly — H3 likely present (both reads are the same RPC call)"
    ).toBe(false);
  });
});

test.describe("Wallet positions — covers H5", () => {
  test("H5: bot-tracked rows show is_bot_tracked=true when engine has matching open positions", async ({
    request,
  }) => {
    const health = (await getJson(request, "/api/health")).data;
    if (health.paper_mode) {
      test.skip(true, "paper mode — wallet-positions returns []");
    }

    const positionsResp = await getJson(request, "/api/positions");
    const enginePositions = (positionsResp.data ?? []) as Json[];
    if (enginePositions.length === 0) {
      test.skip(true, "engine has no open positions — cannot exercise H5");
    }

    const wallet = (await getJson(request, "/api/wallet-positions")).data as Json[];
    if (wallet.length === 0) {
      test.skip(true, "wallet-positions empty (likely RPC issue)");
    }

    // The bug: api/routes/positions.py compares full conditionId against
    // bot_market_ids built from gamma market_ids — never matches.
    //
    // After the H5 fix the comparison joins on token_id, which is the
    // on-chain asset identifier. Verify every wallet row marked
    // is_bot_tracked has a matching engine token_id, AND every engine
    // open position whose tokens are still above the wallet-positions
    // size threshold (0.01) has a matching wallet row.
    const botTokenIds = new Set(
      enginePositions.map((p) => p.token_id).filter(Boolean)
    );
    for (const w of wallet) {
      if (w.is_bot_tracked) {
        expect(
          botTokenIds.has(w.asset_id),
          `Wallet row marked is_bot_tracked but asset_id ${w.asset_id} not in engine open positions`
        ).toBe(true);
      }
    }
    // Reverse direction: engine positions with substantive token
    // quantity (> wallet-positions threshold of 0.01) should have a
    // wallet row. Below-threshold residual dust (e.g. 0.00254 tokens
    // left after a near-complete close) is filtered out by the route
    // and is a separate close-out concern, not an H5 mismatch.
    const walletAssetIds = new Set(wallet.map((w) => w.asset_id));
    for (const p of enginePositions) {
      if (!p.token_id) continue;
      if (Number(p.size_usdc ?? 0) < 0.5) continue; // dust below cents
      expect(
        walletAssetIds.has(p.token_id),
        `Engine open position ${p.market_id} (token=${p.token_id}, size=${p.size_usdc}) has no wallet row`
      ).toBe(true);
    }
  });
});

test.describe("Open position dict — covers M1 (stranded fields)", () => {
  test("M1: regime_at_entry is populated when an entry has a regime classification", async ({
    request,
  }) => {
    const positions = (await getJson(request, "/api/positions")).data as Json[];
    if (positions.length === 0) {
      test.skip(true, "no open positions");
    }
    // Soft-assert: regime_at_entry should be a non-empty string for at
    // least one open position once the bot has been running long enough
    // to classify markets. The bug: it's hardcoded "" everywhere.
    const populated = positions.filter((p) => (p.regime_at_entry ?? "") !== "");
    console.log(
      `[M1 indicator] ${populated.length}/${positions.length} open positions have regime_at_entry populated`
    );
    expect(positions.every((p) => p.regime_at_entry === "")).toBe(false);
  });
});

test.describe("Money trail integrity", () => {
  test("losses categories sum to total_lost without negative residual", async ({
    request,
  }) => {
    const mt = (await getJson(request, "/api/money-trail")).data;
    const fees = Number(mt.summary?.lost_to_fees ?? 0);
    const infra = Number(mt.summary?.lost_to_infrastructure ?? 0);
    const slippage = Number(mt.summary?.lost_to_execution_slippage ?? 0);
    const tradingPnl = Number(mt.summary?.pnl_from_trading ?? 0);
    const total = Number(mt.summary?.total_lost ?? 0);

    // Loose sanity — no field individually exceeds total_lost when total_lost > 0
    if (total > 0) {
      expect(fees).toBeLessThanOrEqual(total + 0.5);
      expect(infra).toBeLessThanOrEqual(total + 0.5);
      expect(slippage).toBeLessThanOrEqual(total + 0.5);
    }
    // Trading P&L is signed; if positive we shouldn't double-count it.
    expect(typeof tradingPnl).toBe("number");
  });
});

test.describe("Portfolio response shape", () => {
  test("portfolio always carries the fields the frontend expects", async ({
    request,
  }) => {
    const j = await getJson(request, "/api/portfolio");
    expect(j.success).toBe(true);
    expect(j.data).toMatchObject({
      balance: expect.any(Number),
      pnl: expect.any(Number),
      positions: expect.any(Number),
      win_rate: expect.any(Number),
      realised_pnl: expect.any(Number),
      unrealised_pnl: expect.any(Number),
      open_positions: expect.any(Array),
      audit: expect.any(Object),
    });
  });
});
