import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-primary bg-primary text-text-inverse shadow-sm hover:bg-primary-hover focus-visible:ring-primary/30",
  secondary:
    "border border-border bg-surface text-text-primary hover:bg-surface-soft focus-visible:ring-accent/30",
  ghost:
    "border border-transparent bg-transparent text-text-secondary hover:bg-surface-soft hover:text-text-primary focus-visible:ring-accent/30",
};

export function Button({ className, type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
