import { cn } from "@/lib/cn";

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <progress
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-surface-soft",
        "[&::-webkit-progress-bar]:bg-surface-soft [&::-webkit-progress-bar]:rounded-full",
        "[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary",
        "[&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary",
        className,
      )}
      value={clampedValue}
      max={100}
      aria-label="Progress"
    />
  );
}
