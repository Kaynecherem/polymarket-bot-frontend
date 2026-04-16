"use client";

import { useState, useCallback } from "react";
import { useMarkets } from "@/hooks/use-markets";
import { useSignals } from "@/hooks/use-signals";
import { MarketGrid } from "@/components/markets/MarketGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function MarketsContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { data: signals } = useSignals();

  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const { data: result, isLoading, error } = useMarkets({ page, limit: 24, search });

  const markets = result?.data ?? [];
  const totalPages = result?.pages ?? 1;
  const total = result?.total ?? 0;

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-accent-red">
        Failed to load markets: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {total} markets
        </span>
      </div>

      <MarketGrid
        markets={markets}
        signals={signals ?? []}
        loading={isLoading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3 w-3" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
