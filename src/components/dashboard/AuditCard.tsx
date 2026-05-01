"use client";

import { usePortfolio } from "@/hooks/use-portfolio";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

function Stat({
  label,
  value,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "red" | "muted";
  sub?: string;
}) {
  const toneClass =
    tone === "green"
      ? "text-accent-green"
      : tone === "red"
      ? "text-accent-red"
      : tone === "muted"
      ? "text-muted-foreground"
      : "text-foreground";
  return (
    <div className="flex flex-col">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`text-sm font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  );
}

export function AuditCard() {
  const { data: portfolio, isLoading } = usePortfolio();

  if (isLoading || !portfolio?.audit) {
    return <Skeleton className="h-32 rounded-lg" />;
  }

  const a = portfolio.audit;
  const isLive = portfolio.paper_mode === false;
  const ledgerDrift = a.ledger_drift ?? a.ledger_vs_state_delta ?? 0;
  // Positive drift (on-chain > ledger) means cash arrived from a path the
  // trade ledger doesn't track — typically redemptions of resolved positions
  // or external deposits. That's not a problem, just an accounting gap.
  // Negative drift (on-chain < ledger) is the worrying case — money missing
  // from the wallet that the ledger thinks should be there.
  const driftIsFavorable = ledgerDrift > 0;
  const driftWarning = (a.drift_warning ?? (Math.abs(ledgerDrift) > 1.0)) && !driftIsFavorable;
  const gainedPct = a.starting_balance > 0 ? (a.realized_gained / a.starting_balance) * 100 : 0;
  const lostPct = a.starting_balance > 0 ? (a.realized_lost / a.starting_balance) * 100 : 0;
  const netTone: "green" | "red" | "neutral" =
    a.realized_net > 0 ? "green" : a.realized_net < 0 ? "red" : "neutral";
  const totalFees = a.total_fees ?? 0;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Audit &mdash; {isLive ? "On-Chain Source of Truth" : "Ledger Source of Truth"}
        </div>
        {driftWarning ? (
          <span className="rounded-md border border-accent-red px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-red"
            title="On-chain balance is lower than ledger expects — investigate.">
            drift: {ledgerDrift >= 0 ? "+" : ""}
            {formatCurrency(ledgerDrift)}
          </span>
        ) : driftIsFavorable && Math.abs(ledgerDrift) > 1.0 ? (
          <span className="rounded-md border border-accent-orange/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-orange/90"
            title="Wallet has more cash than the trades ledger tracks — typically from redemptions of resolved positions or external deposits.">
            +{formatCurrency(ledgerDrift)} unrecorded
          </span>
        ) : (
          <span className="rounded-md border border-accent-green px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-green">
            reconciled
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Starting" value={formatCurrency(a.starting_balance)} tone="muted" />
        <Stat
          label="Cash (ledger)"
          value={formatCurrency(a.cash_from_ledger)}
          sub={`+ ${formatCurrency(a.tied_up_in_positions)} tied up`}
        />
        <Stat label="NAV" value={formatCurrency(a.nav)} />
        <Stat
          label="Return"
          value={`${a.return_pct >= 0 ? "+" : ""}${a.return_pct.toFixed(2)}%`}
          tone={a.return_pct > 0 ? "green" : a.return_pct < 0 ? "red" : "neutral"}
        />
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat
            label="Gained"
            value={`+${formatCurrency(a.realized_gained)}`}
            tone="green"
            sub={`${gainedPct.toFixed(2)}%`}
          />
          <Stat
            label="Lost"
            value={`-${formatCurrency(a.realized_lost)}`}
            tone="red"
            sub={`${lostPct.toFixed(2)}%`}
          />
          <Stat
            label="Net Realized"
            value={`${a.realized_net >= 0 ? "+" : ""}${formatCurrency(a.realized_net)}`}
            tone={netTone}
            sub={`${a.wins}W / ${a.losses}L`}
          />
          <Stat
            label="Win Rate"
            value={`${a.win_rate_pct.toFixed(1)}%`}
            sub={`${a.closes_total} closes`}
          />
        </div>
      </div>

      {(totalFees > 0 || (isLive && a.on_chain_balance !== undefined)) && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {totalFees > 0 && (
              <Stat label="Fees Paid" value={`-${formatCurrency(totalFees)}`} tone="red" />
            )}
            {isLive && a.on_chain_balance !== undefined && (
              <Stat label="On-Chain" value={formatCurrency(a.on_chain_balance)} tone="neutral" />
            )}
            {isLive && a.ledger_drift !== undefined && (
              <Stat
                label="Ledger Drift"
                value={`${a.ledger_drift >= 0 ? "+" : ""}${formatCurrency(a.ledger_drift)}`}
                tone={
                  Math.abs(a.ledger_drift) <= 1
                    ? "green"
                    : a.ledger_drift > 0
                    ? "muted"
                    : "red"
                }
                sub={a.ledger_drift > 1 ? "from redemptions/deposits" : undefined}
              />
            )}
          </div>
        </div>
      )}

      {a.legacy_partial_closes > 0 && (
        <div className="mt-3 rounded-md border border-accent-orange/40 bg-accent-orange/5 p-2 text-[10px] text-accent-orange">
          Historical note: {a.legacy_partial_closes} partial-close rows from the disabled
          scale-out feature are retained as audit records. They are excluded from the win/loss
          counts above to avoid double-counting. See analysis_20260415.
        </div>
      )}
    </Card>
  );
}
