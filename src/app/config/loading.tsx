import { Skeleton } from "@/components/ui/skeleton";

export default function ConfigLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 max-w-xl rounded-lg" />
      <Skeleton className="h-40 max-w-xl rounded-lg" />
      <Skeleton className="h-48 max-w-xl rounded-lg" />
      <Skeleton className="h-32 max-w-xl rounded-lg" />
    </div>
  );
}
