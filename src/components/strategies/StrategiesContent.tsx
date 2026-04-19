"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchStrategyConfigs,
  updateStrategyConfig,
  resetStrategyConfigs,
  fetchRiskConfig,
  updateRiskConfig,
  fetchConservativeMode,
  toggleConservativeMode,
} from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { AdminOnly, AdminButton } from "@/components/ui/admin-only";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, ShieldOff } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalibrationSection } from "@/components/strategies/CalibrationSection";

interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  type: "number" | "toggle";
}

const STRATEGY_PARAMS: Record<string, { label: string; color: string; params: ParamDef[] }> = {
  arbitrage: {
    label: "Arbitrage",
    color: "hsl(154 100% 50%)",
    params: [
      { key: "min_edge", label: "Min Edge", min: 0.01, max: 0.50, step: 0.01, type: "number" },
      { key: "min_confidence", label: "Min Confidence", min: 0.10, max: 1.0, step: 0.05, type: "number" },
      { key: "min_liquidity", label: "Min Liquidity $", min: 10, max: 10000, step: 10, type: "number" },
      { key: "max_spread_ratio", label: "Max Spread Ratio", min: 0.01, max: 0.50, step: 0.01, type: "number" },
    ],
  },
  reversion: {
    label: "Mean Reversion",
    color: "hsl(40 100% 50%)",
    params: [
      { key: "min_edge", label: "Min Edge", min: 0.01, max: 0.50, step: 0.01, type: "number" },
      { key: "min_confidence", label: "Min Confidence", min: 0.10, max: 1.0, step: 0.05, type: "number" },
      { key: "z_score_threshold", label: "Z-Score Threshold", min: 0.5, max: 3.0, step: 0.1, type: "number" },
      { key: "volatility_min", label: "Min Volatility", min: 0.001, max: 0.10, step: 0.001, type: "number" },
      { key: "volatility_max", label: "Max Volatility", min: 0.05, max: 0.50, step: 0.01, type: "number" },
    ],
  },
  sentiment: {
    label: "Sentiment",
    color: "hsl(224 100% 73%)",
    params: [
      { key: "min_edge", label: "Min Edge", min: 0.01, max: 0.50, step: 0.01, type: "number" },
      { key: "min_confidence", label: "Min Confidence", min: 0.10, max: 1.0, step: 0.05, type: "number" },
      { key: "llm_enabled", label: "LLM Enabled", min: 0, max: 1, step: 1, type: "toggle" },
      { key: "price_cap", label: "Max Price Cap", min: 0.50, max: 0.95, step: 0.05, type: "number" },
    ],
  },
  cross_market: {
    label: "Cross-Market",
    color: "hsl(280 80% 60%)",
    params: [
      { key: "min_correlation", label: "Min Correlation", min: 0.30, max: 0.95, step: 0.05, type: "number" },
      { key: "min_history", label: "Min History Points", min: 10, max: 100, step: 5, type: "number" },
      { key: "min_liquidity", label: "Min Liquidity $", min: 10, max: 10000, step: 10, type: "number" },
    ],
  },
};

function StrategyConfigCard({
  strategyKey,
  meta,
  config,
  onSave,
}: {
  strategyKey: string;
  meta: (typeof STRATEGY_PARAMS)[string];
  config: Record<string, unknown>;
  onSave: (key: string, cfg: Record<string, unknown>) => Promise<void>;
}) {
  const [local, setLocal] = useState<Record<string, unknown>>(config);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const hasChanges = JSON.stringify(local) !== JSON.stringify(config);

  useEffect(() => { setLocal(config); }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(strategyKey, local);
    setSaving(false);
  };

  return (
    <Card className={`p-4 ${hasChanges ? "border-accent-orange/50" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
          <span className="text-sm font-semibold">{meta.label}</span>
        </div>
        <Switch
          checked={local.enabled as boolean}
          onCheckedChange={(v) => setLocal((p) => ({ ...p, enabled: v }))}
          disabled={!isAdmin}
        />
      </div>
      <Separator className="mb-3" />
      <div className="space-y-2">
        {meta.params.map((param) => (
          <div key={param.key} className="flex items-center justify-between gap-4">
            <Label className="min-w-[120px]">{param.label}</Label>
            {param.type === "toggle" ? (
              <Switch
                checked={!!local[param.key]}
                onCheckedChange={(v) => setLocal((p) => ({ ...p, [param.key]: v }))}
                disabled={!isAdmin}
              />
            ) : (
              <Input
                type="number"
                className="w-24 text-right"
                value={String(local[param.key] ?? "")}
                min={param.min}
                max={param.max}
                step={param.step}
                onChange={(e) => setLocal((p) => ({ ...p, [param.key]: parseFloat(e.target.value) || 0 }))}
                disabled={!isAdmin}
              />
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <div className="mt-3 flex gap-2">
          <Button variant="success" size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={() => setLocal(config)}>
              Discard
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

const RISK_FIELDS: ParamDef[] = [
  { key: "max_position_pct", label: "Max Position %", min: 0.01, max: 0.20, step: 0.01, type: "number" },
  { key: "max_total_exposure_pct", label: "Max Total Exposure %", min: 0.10, max: 0.50, step: 0.05, type: "number" },
  { key: "max_category_exposure_pct", label: "Max Category Exposure %", min: 0.05, max: 0.30, step: 0.05, type: "number" },
  { key: "kelly_fraction", label: "Kelly Fraction", min: 0.1, max: 1.0, step: 0.1, type: "number" },
  { key: "max_daily_drawdown_pct", label: "Max Daily Drawdown %", min: 0.05, max: 0.30, step: 0.05, type: "number" },
  { key: "max_weekly_drawdown_pct", label: "Max Weekly Drawdown %", min: 0.10, max: 0.50, step: 0.05, type: "number" },
  { key: "losing_streak_pause_count", label: "Losing Streak Pause", min: 3, max: 10, step: 1, type: "number" },
];

const SCALP_FIELDS: ParamDef[] = [
  { key: "scalp_days_threshold", label: "Days Threshold", min: 1, max: 30, step: 1, type: "number" },
  { key: "scalp_position_pct", label: "Position %", min: 0.01, max: 0.10, step: 0.01, type: "number" },
  { key: "scalp_take_profit_pct", label: "Take Profit %", min: 0.01, max: 0.20, step: 0.01, type: "number" },
  { key: "scalp_stop_loss_pct", label: "Stop Loss %", min: 0.01, max: 0.15, step: 0.01, type: "number" },
  { key: "scalp_max_hold_hours", label: "Max Hold (hours)", min: 1, max: 24, step: 1, type: "number" },
  { key: "scalp_cooldown_seconds", label: "Cooldown (sec)", min: 30, max: 600, step: 30, type: "number" },
  { key: "scalp_max_positions", label: "Max Positions", min: 1, max: 20, step: 1, type: "number" },
];

const SWING_FIELDS: ParamDef[] = [
  { key: "swing_position_pct", label: "Position %", min: 0.01, max: 0.15, step: 0.01, type: "number" },
  { key: "swing_take_profit_pct", label: "Take Profit %", min: 0.05, max: 0.30, step: 0.01, type: "number" },
  { key: "swing_stop_loss_pct", label: "Stop Loss %", min: 0.03, max: 0.20, step: 0.01, type: "number" },
  { key: "swing_max_hold_hours", label: "Max Hold (hours)", min: 12, max: 168, step: 12, type: "number" },
  { key: "swing_cooldown_seconds", label: "Cooldown (sec)", min: 300, max: 7200, step: 300, type: "number" },
  { key: "swing_max_positions", label: "Max Positions", min: 1, max: 10, step: 1, type: "number" },
];

export default function StrategiesContent() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: configs, isLoading } = useQuery({
    queryKey: ["strategy-configs"],
    queryFn: fetchStrategyConfigs,
  });
  const { data: riskConfig } = useQuery({
    queryKey: ["risk-config"],
    queryFn: fetchRiskConfig,
  });
  const { data: conservativeData } = useQuery({
    queryKey: ["conservative"],
    queryFn: fetchConservativeMode,
  });
  const conservativeEnabled = (conservativeData as Record<string, unknown>)?.enabled as boolean ?? true;
  const [riskLocal, setRiskLocal] = useState<Record<string, unknown>>({});
  const [riskSaving, setRiskSaving] = useState(false);
  const [tierLocal, setTierLocal] = useState<Record<string, unknown>>({});
  const [tierSaving, setTierSaving] = useState(false);

  useEffect(() => {
    if (riskConfig) setRiskLocal(riskConfig);
  }, [riskConfig]);

  useEffect(() => {
    if (conservativeData) {
      // Merge current settings into tier local
      setTierLocal(prev => Object.keys(prev).length === 0 ? {
        scalp_days_threshold: 14,
        scalp_position_pct: 0.03,
        scalp_take_profit_pct: 0.05,
        scalp_stop_loss_pct: 0.05,
        scalp_max_hold_hours: 4,
        scalp_cooldown_seconds: 120,
        scalp_max_positions: 10,
        swing_position_pct: 0.05,
        swing_take_profit_pct: 0.15,
        swing_stop_loss_pct: 0.12,
        swing_max_hold_hours: 72,
        swing_cooldown_seconds: 1800,
        swing_max_positions: 5,
        ...prev,
      } : prev);
    }
  }, [conservativeData]);

  const riskHasChanges = JSON.stringify(riskLocal) !== JSON.stringify(riskConfig);

  const handleStrategySave = async (key: string, cfg: Record<string, unknown>) => {
    try {
      await updateStrategyConfig(key, cfg);
      queryClient.invalidateQueries({ queryKey: ["strategy-configs"] });
      toast.success(`${key} config saved`);
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const handleRiskSave = async () => {
    setRiskSaving(true);
    try {
      await updateRiskConfig(riskLocal);
      queryClient.invalidateQueries({ queryKey: ["risk-config"] });
      toast.success("Risk config saved");
    } catch (err) {
      toast.error("Save failed");
    }
    setRiskSaving(false);
  };

  const handleResetAll = async () => {
    try {
      await resetStrategyConfigs();
      queryClient.invalidateQueries({ queryKey: ["strategy-configs"] });
      queryClient.invalidateQueries({ queryKey: ["risk-config"] });
      toast.success("All configs reset to defaults");
    } catch (err) {
      toast.error("Reset failed");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      {/* Conservative Mode Toggle */}
      <Card className={`p-4 ${conservativeEnabled ? "border-accent-orange/40" : "border-accent-green/30"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conservativeEnabled ? (
              <Shield className="h-5 w-5 text-accent-orange" />
            ) : (
              <ShieldOff className="h-5 w-5 text-accent-green" />
            )}
            <div>
              <div className="text-sm font-semibold">
                Conservative Mode {conservativeEnabled ? "ON" : "OFF"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {conservativeEnabled
                  ? "Tighter thresholds, max 3 trades/hour, sentiment requires confirmation"
                  : "Normal trading parameters — higher risk, more trades"}
              </div>
            </div>
          </div>
          <Switch
            checked={conservativeEnabled}
            disabled={!isAdmin}
            onCheckedChange={async (checked) => {
              try {
                await toggleConservativeMode(checked);
                queryClient.invalidateQueries({ queryKey: ["conservative"] });
                toast.success(`Conservative mode ${checked ? "enabled" : "disabled"}`);
              } catch {
                toast.error("Failed to toggle conservative mode");
              }
            }}
          />
        </div>
      </Card>

      {/* Auto-Tune Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Auto-Tune</div>
            <div className="text-[10px] text-muted-foreground">
              Automatically adjusts strategy parameters based on rolling performance (hourly)
            </div>
          </div>
          <Switch
            checked={true}
            disabled={!isAdmin}
            onCheckedChange={async (checked) => {
              toast.info(`Auto-tune ${checked ? "enabled" : "disabled"} (runtime only)`);
            }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Object.entries(STRATEGY_PARAMS).map(([key, meta]) => (
          <StrategyConfigCard
            key={key}
            strategyKey={key}
            meta={meta}
            config={(configs?.[key] as Record<string, unknown>) ?? {}}
            onSave={handleStrategySave}
          />
        ))}
      </div>

      <CalibrationSection />

      <Card className={`p-4 ${riskHasChanges ? "border-accent-orange/50" : ""}`}>
        <div className="mb-3 text-sm font-semibold">Risk Management</div>
        <Separator className="mb-3" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {RISK_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center justify-between gap-4">
              <Label className="min-w-[160px]">{field.label}</Label>
              <Input
                type="number"
                className="w-24 text-right"
                value={String(riskLocal[field.key] ?? "")}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={(e) => setRiskLocal((p) => ({ ...p, [field.key]: parseFloat(e.target.value) || 0 }))}
                disabled={!isAdmin}
              />
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="mt-3 flex gap-2">
            <Button variant="success" size="sm" onClick={handleRiskSave} disabled={riskSaving || !riskHasChanges}>
              {riskSaving ? "Saving..." : "Save"}
            </Button>
            {riskHasChanges && (
              <Button variant="ghost" size="sm" onClick={() => setRiskLocal(riskConfig ?? {})}>
                Discard
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Trading Tiers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="blue">SCALP</Badge>
            <span className="text-sm font-semibold">Scalp Tier</span>
            <span className="text-[10px] text-muted-foreground">(&lt;14 days to expiry)</span>
          </div>
          <Separator className="mb-3" />
          <div className="space-y-2">
            {SCALP_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center justify-between gap-4">
                <Label className="min-w-[120px]">{field.label}</Label>
                <Input
                  type="number"
                  className="w-24 text-right"
                  value={String(tierLocal[field.key] ?? "")}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(e) => setTierLocal((p) => ({ ...p, [field.key]: parseFloat(e.target.value) || 0 }))}
                  disabled={!isAdmin}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">SWING</Badge>
            <span className="text-sm font-semibold">Swing Tier</span>
            <span className="text-[10px] text-muted-foreground">(&gt;14 days to expiry)</span>
          </div>
          <Separator className="mb-3" />
          <div className="space-y-2">
            {SWING_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center justify-between gap-4">
                <Label className="min-w-[120px]">{field.label}</Label>
                <Input
                  type="number"
                  className="w-24 text-right"
                  value={String(tierLocal[field.key] ?? "")}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(e) => setTierLocal((p) => ({ ...p, [field.key]: parseFloat(e.target.value) || 0 }))}
                  disabled={!isAdmin}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AdminOnly>
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Reset All to Defaults</Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Strategy Configs?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all strategy and risk parameters to their default values. Any auto-tuning adjustments will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll} className="bg-accent-red/15 text-accent-red border border-accent-red/40">
                Reset All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminOnly>
    </motion.div>
  );
}
