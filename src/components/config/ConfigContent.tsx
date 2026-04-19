"use client";

import { ConfigForm } from "@/components/config/ConfigForm";
import { ConnectionTest } from "@/components/config/ConnectionTest";
import { LiveWarning } from "@/components/config/LiveWarning";
import { Card } from "@/components/ui/card";
import { AdminOnly } from "@/components/ui/admin-only";
import { useDetailedHealth } from "@/hooks/use-detailed-health";
import { useHealth } from "@/hooks/use-health";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ResetButton } from "@/components/dashboard/ResetButton";
import { depositPaper, withdrawPaper, fetchTransactions } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function SystemHealthPanel() {
  const { data: health } = useDetailedHealth();
  if (!health) return null;

  const memColor = health.memory_mb > 1000 ? "text-accent-red" : health.memory_mb > 500 ? "text-accent-orange" : "text-accent-green";

  const items = [
    { label: "Memory Usage", value: `${health.memory_mb} MB`, color: memColor },
    { label: "Markets Cached", value: String(health.markets_cached), color: "text-foreground" },
    { label: "Trading Universe", value: String(health.markets_trading), color: "text-foreground" },
    { label: "Active Strategies", value: health.active_strategies?.join(", ") || "None", color: "text-foreground" },
    { label: "Signals This Cycle", value: String(health.signals_this_cycle), color: "text-foreground" },
    { label: "Price History Points", value: health.price_history_points?.toLocaleString() || "0", color: "text-foreground" },
    { label: "LLM Calls Today", value: String(health.llm_calls_today), color: "text-foreground" },
    { label: "Active Cooldowns", value: String(health.cooldowns_active), color: "text-foreground" },
    { label: "Open Positions", value: String(health.open_positions), color: "text-foreground" },
    { label: "WS Clients", value: String(health.ws_clients), color: "text-foreground" },
    { label: "Drawdown Guard", value: health.drawdown_guard_active ? `ACTIVE: ${health.drawdown_guard_reason}` : "Clear", color: health.drawdown_guard_active ? "text-accent-red" : "text-accent-green" },
  ];

  return (
    <Card className="max-w-xl p-5">
      <div className="mb-3 text-sm font-semibold">System Health</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between border-b border-border/50 py-1.5">
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
            <span className={`text-[11px] font-medium ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PaperTradingSection() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const queryClient = useQueryClient();

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    refetchInterval: 30000,
  });

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    setDepositing(true);
    try {
      await depositPaper(amt);
      toast.success(`Deposited $${amt.toLocaleString()}`);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDepositAmount("");
    } catch (err) {
      toast.error(`Deposit failed: ${err instanceof Error ? err.message : "Error"}`);
    }
    setDepositing(false);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    setWithdrawing(true);
    try {
      await withdrawPaper(amt);
      toast.success(`Withdrew $${amt.toLocaleString()}`);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setWithdrawAmount("");
    } catch (err) {
      toast.error(`Withdrawal failed: ${err instanceof Error ? err.message : "Error"}`);
    }
    setWithdrawing(false);
  };

  return (
    <Card className="max-w-xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Paper Trading</div>
        <AdminOnly>
          <ResetButton />
        </AdminOnly>
      </div>

      <AdminOnly>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Deposit</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0"
                step="100"
              />
              <Button variant="success" size="sm" onClick={handleDeposit} disabled={depositing}>
                {depositing ? "..." : "+"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Withdraw</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="0"
                step="100"
              />
              <Button variant="destructive" size="sm" onClick={handleWithdraw} disabled={withdrawing}>
                {withdrawing ? "..." : "-"}
              </Button>
            </div>
          </div>
        </div>
      </AdminOnly>

      {transactions && transactions.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Transaction History
          </div>
          <ScrollArea className="h-32">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 py-1.5 text-[10px]">
                <span className="text-muted-foreground">
                  {new Date(tx.timestamp as string).toLocaleDateString()}
                </span>
                <span className={
                  tx.type === "deposit" ? "text-accent-green" :
                  tx.type === "withdrawal" ? "text-accent-red" :
                  "text-accent-orange"
                }>
                  {tx.type === "deposit" ? "+" : tx.type === "withdrawal" ? "-" : ""}
                  ${(tx.amount as number)?.toLocaleString()}
                </span>
                <span className="text-muted-foreground">${(tx.balance_after as number)?.toLocaleString()}</span>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}

export default function ConfigContent() {
  const { data: health } = useHealth();
  const paperMode = health?.paper_mode ?? true;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <ConfigForm />
      <ConnectionTest />

      {paperMode && (
        <PaperTradingSection />
      )}

      {!paperMode && (
        <LiveWarning />
      )}

      <SystemHealthPanel />
    </motion.div>
  );
}
