"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { evaluatePasswordStrength } from "@/lib/password-strength";

interface PasswordStrengthIndicatorProps {
  password: string;
  onChange?: (password: string) => void;
}

export function PasswordStrengthIndicator({ password, onChange }: PasswordStrengthIndicatorProps) {
  const [showPassword, setShowPassword] = useState(false);
  const result = evaluatePasswordStrength(password);

  const strengthColors = {
    Weak: "bg-error",
    Fair: "bg-warning",
    Good: "bg-yellow-500",
    Strong: "bg-success",
  };

  const strengthTextColors = {
    Weak: "text-error",
    Fair: "text-warning",
    Good: "text-yellow-600",
    Strong: "text-success",
  };

  const filledSegments = result.rulesMet;

  return (
    <div className="space-y-4">
      {/* Password Input with Toggle */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-default">
          Password <span className="text-error">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-default transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Strength</span>
          <span className={`text-sm font-semibold ${strengthTextColors[result.strength]}`}>{result.strength}</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((segment) => (
            <div
              key={segment}
              className={`flex-1 h-2 rounded-full transition-colors duration-150 ease-in-out ${
                segment <= filledSegments ? strengthColors[result.strength] : "bg-surface-soft"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Rule Checklist */}
      <div className="space-y-2">
        <div className="space-y-1.5">
          <RuleItem
            label="At least 8 characters"
            met={result.rules.minLength}
          />
          <RuleItem
            label="At least one uppercase letter (A-Z)"
            met={result.rules.hasUppercase}
          />
          <RuleItem
            label="At least one lowercase letter (a-z)"
            met={result.rules.hasLowercase}
          />
          <RuleItem
            label="At least one number (0-9)"
            met={result.rules.hasNumber}
          />
          <RuleItem
            label="At least one special character (!@#$%^&*)"
            met={result.rules.hasSpecialChar}
          />
        </div>
      </div>

      {/* Strength Indicator */}
      <div className="text-xs text-text-muted">
        {result.isStrong ? (
          <span className="text-success font-semibold">✓ Password is strong and ready</span>
        ) : (
          <span>{result.rulesMet} of 5 requirements met</span>
        )}
      </div>
    </div>
  );
}

function RuleItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check
          size={16}
          className="text-success transition-colors duration-150 ease-in-out flex-shrink-0"
        />
      ) : (
        <X
          size={16}
          className="text-text-muted transition-colors duration-150 ease-in-out flex-shrink-0"
        />
      )}
      <span className={`text-sm ${met ? "text-success" : "text-text-muted"} transition-colors duration-150 ease-in-out`}>
        {label}
      </span>
    </div>
  );
}
