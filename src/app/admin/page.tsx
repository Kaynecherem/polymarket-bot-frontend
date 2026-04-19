"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const { isAdmin, isLoading, login } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const ok = await login(password);
    setSubmitting(false);
    if (ok) {
      router.replace("/dashboard");
    } else {
      setError("Invalid credentials");
      setPassword("");
    }
  };

  if (isLoading || isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <h1 className="text-sm font-semibold">Authentication Required</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={submitting}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-accent-red">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !password}
          >
            {submitting ? "Authenticating..." : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
