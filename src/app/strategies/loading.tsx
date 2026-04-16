import { Skeleton } from "@/components/ui/skeleton";

export default function StrategiesLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
