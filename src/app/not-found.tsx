import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Page Not Found</h2>
      <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Link
        href="/dashboard"
        className="text-xs text-accent-green underline underline-offset-4 hover:text-accent-green/80"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
