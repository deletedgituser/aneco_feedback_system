import type { PasswordStrengthResult } from "@/types";

/**
 * Evaluates password against 5 strength rules:
 * 1. Minimum 8 characters
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one number (0-9)
 * 5. At least one special character (!@#$%^&* etc)
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const rules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const rulesMet = Object.values(rules).filter(Boolean).length;

  let strength: "Weak" | "Fair" | "Good" | "Strong";
  if (rulesMet <= 2) {
    strength = "Weak";
  } else if (rulesMet === 3) {
    strength = "Fair";
  } else if (rulesMet === 4) {
    strength = "Good";
  } else {
    strength = "Strong";
  }

  return {
    rules,
    strength,
    rulesMet,
    isStrong: rulesMet === 5,
  };
}
