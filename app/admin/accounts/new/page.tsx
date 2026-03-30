"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { FlashToast } from "@/components/ui/flash-toast";

export default function AddAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    isStrong: false,
    rulesMet: 0,
  });

  function handlePasswordChange(newPassword: string) {
    setFormData((prev) => ({ ...prev, password: newPassword }));

    // Evaluate strength
    const rules = {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    };

    const rulesMet = Object.values(rules).filter(Boolean).length;
    setPasswordStrength({
      isStrong: rulesMet === 5,
      rulesMet,
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!passwordStrength.isStrong) {
      setError("Password must meet all 5 strength requirements.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          name: formData.name,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create account.");
        return;
      }

      router.push(
        `/admin/accounts?toastType=success&toastMessage=${encodeURIComponent("Account created successfully.")}`
      );
      router.refresh();
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/accounts"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default transition-colors duration-150 hover:bg-surface-soft"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-default">Add New Account</h1>

        {error && (
          <div className="mb-6">
            <FlashToast type="error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Username */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-default">
              Username <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Username"
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            <p className="text-xs text-text-muted">
              Can only contain letters, numbers, hyphens, and underscores
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-default">
              Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-default">
              Full Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
          </div>

          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator
            password={formData.password}
            onChange={handlePasswordChange}
          />

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-default">
              Confirm Password <span className="text-error">*</span>
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm password"
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="text-xs text-error">Passwords do not match</p>
              )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!passwordStrength.isStrong || loading || formData.password !== formData.confirmPassword}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/accounts")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
