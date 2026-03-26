import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("rounded-2xl border border-border bg-surface p-6 shadow-sm", className)} {...props} />;
}

type CardHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {subtitle ? <p className="text-sm text-text-secondary">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
