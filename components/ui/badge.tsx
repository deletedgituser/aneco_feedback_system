import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  tone?: BadgeTone;
  children: React.ReactNode;
};

const toneClass: Record<BadgeTone, string> = {
  neutral: "border border-border bg-surface-soft text-text-primary",
  success: "border border-success/35 bg-success/15 text-success",
  warning: "border border-warning/45 bg-warning/20 text-text-primary",
  danger: "border border-danger/35 bg-danger/14 text-danger",
  info: "border border-info/30 bg-info/12 text-info",
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", toneClass[tone])}>{children}</span>;
}
