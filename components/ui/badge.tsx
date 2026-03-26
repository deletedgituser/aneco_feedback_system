import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  tone?: BadgeTone;
  children: React.ReactNode;
};

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-primary-light text-text-primary",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-danger/20 text-danger",
  info: "bg-info/20 text-info",
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", toneClass[tone])}>{children}</span>;
}
