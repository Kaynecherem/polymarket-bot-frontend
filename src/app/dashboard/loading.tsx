import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-9">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-4 h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-10 w-full" />
          ))}
        </div>
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-4 h-4 w-24" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-6 w-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
