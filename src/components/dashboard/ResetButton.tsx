"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { resetPaperTrading, exportPaperData } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw, Download } from "lucide-react";

export function ResetButton() {
  const [resetting, setResetting] = useState(false);
  const queryClient = useQueryClient();

  const handleExport = async () => {
    try {
      const data = await exportPaperData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `polymarket-paper-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetPaperTrading();
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      toast.success("Paper trading reset — balance restored to $10,000");
    } catch (err) {
      toast.error(`Reset failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    setResetting(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1.5">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Paper Trading?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete all trades, close all positions, and reset your balance to $10,000.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExport}>
            <Download className="h-3 w-3" />
            Export Data First
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={resetting}
            className="bg-accent-red/15 text-accent-red border border-accent-red/40 hover:bg-accent-red/25"
          >
            {resetting ? "Resetting..." : "Reset"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
