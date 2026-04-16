import { Skeleton } from "@/components/ui/skeleton";

export default function TradesLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="mb-4 h-4 w-28" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
