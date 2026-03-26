"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DropdownProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

export function Dropdown({ open, children, className }: DropdownProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-48 rounded-2xl border border-border bg-surface p-2.5 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
