import { Skeleton } from "@/components/ui/skeleton";

export default function MarketsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
