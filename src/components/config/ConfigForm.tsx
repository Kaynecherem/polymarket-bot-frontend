"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useHealth } from "@/hooks/use-health";
import { toast } from "sonner";

interface ConfigData {
  apiKey: string;
  walletAddress: string;
  rpcEndpoint: string;
  paperMode: boolean;
  newsapiKey: string;
}

const DEFAULTS: ConfigData = {
  apiKey: "",
  walletAddress: "",
  rpcEndpoint: "",
  paperMode: true,
  newsapiKey: "",
};

export function ConfigForm() {
  const [config, setConfig] = useState<ConfigData>(DEFAULTS);
  const [errors, setErrors] = useState<Partial<Record<keyof ConfigData, string>>>({});
  const { data: health } = useHealth();

  // Sync paper mode from backend health endpoint
  useEffect(() => {
    if (health) {
      setConfig((prev) => ({ ...prev, paperMode: health.paper_mode }));
    }
  }, [health]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ConfigData, string>> = {};
    if (config.walletAddress && !config.walletAddress.startsWith("0x")) {
      errs.walletAddress = "Must start with 0x";
    }
    if (config.rpcEndpoint && !config.rpcEndpoint.startsWith("http")) {
      errs.rpcEndpoint = "Must be a valid URL";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    localStorage.setItem("polybot_config", JSON.stringify(config));
    toast.success("Configuration saved");
  };

  const update = <K extends keyof ConfigData>(key: K, value: ConfigData[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Card className="max-w-xl p-5">
      <div className="mb-4 text-sm font-semibold">Configuration</div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            className="mt-1"
            value={config.apiKey}
            onChange={(e) => update("apiKey", e.target.value)}
            placeholder="Enter Polymarket API key"
          />
        </div>

        <div>
          <Label htmlFor="wallet">Wallet Address</Label>
          <Input
            id="wallet"
            className="mt-1"
            value={config.walletAddress}
            onChange={(e) => update("walletAddress", e.target.value)}
            placeholder="0x..."
          />
          {errors.walletAddress && (
            <p className="mt-1 text-[10px] text-accent-red">{errors.walletAddress}</p>
          )}
        </div>

        <div>
          <Label htmlFor="rpc">RPC Endpoint</Label>
          <Input
            id="rpc"
            className="mt-1"
            value={config.rpcEndpoint}
            onChange={(e) => update("rpcEndpoint", e.target.value)}
            placeholder="https://polygon-rpc.com"
          />
          {errors.rpcEndpoint && (
            <p className="mt-1 text-[10px] text-accent-red">{errors.rpcEndpoint}</p>
          )}
        </div>

        <div>
          <Label htmlFor="newsapi">NewsAPI Key</Label>
          <Input
            id="newsapi"
            type="password"
            className="mt-1"
            value={config.newsapiKey}
            onChange={(e) => update("newsapiKey", e.target.value)}
            placeholder="Enter NewsAPI key"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Paper Mode</Label>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold ${config.paperMode ? "text-accent-orange" : "text-accent-red"}`}>
              {config.paperMode ? "PAPER" : "LIVE"}
            </span>
            <Switch
              checked={config.paperMode}
              disabled
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>GDELT (Free)</Label>
          <span className="text-[10px] font-semibold text-accent-green">ALWAYS ON</span>
        </div>

        <Button variant="success" onClick={save}>Save Config</Button>
      </div>
    </Card>
  );
}
