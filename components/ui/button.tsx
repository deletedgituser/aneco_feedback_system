import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-inverse border border-primary hover:bg-primary-hover focus-visible:ring-primary/30",
  secondary:
    "bg-surface text-text-primary border border-border hover:bg-primary-light focus-visible:ring-accent/40",
  ghost:
    "bg-transparent text-text-secondary border border-transparent hover:bg-primary-light hover:text-text-primary focus-visible:ring-accent/30",
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
