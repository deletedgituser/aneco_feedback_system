import { cn } from "@/lib/cn";

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("h-2.5 w-full rounded-full bg-surface-soft", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-150 ease-in-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
