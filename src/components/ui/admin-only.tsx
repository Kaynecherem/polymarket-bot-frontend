"use client";

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ComponentProps } from "react";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return <>{children}</>;
}

export function AdminButton(props: ComponentProps<typeof Button>) {
  const { isAdmin } = useAuth();
  if (isAdmin) return <Button {...props} />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            {...props}
            disabled
            className={`${props.className ?? ""} cursor-not-allowed opacity-50`}
          >
            {props.children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Admin access required</TooltipContent>
    </Tooltip>
  );
}
