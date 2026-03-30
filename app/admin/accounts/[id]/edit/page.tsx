"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { FlashToast } from "@/components/ui/flash-toast";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id as string;

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
  });

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    isStrong: false,
    rulesMet: 0,
  });

  useEffect(() => {
    async function loadUser() {
      if (!accountId) return;
      try {
        const response = await fetch(`/api/admin/accounts/${accountId}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Unable to load account data.");
          return;
        }

        const data = await response.json();
        setFormData({
          username: data.username || "",
          email: data.email || "",
          name: data.name || "",
        });
      } catch {
        setError("Unable to load account data. Please refresh.");
      }
    }

    loadUser();
  }, [accountId]);

  function handlePasswordChange(newPassword: string) {
    setPasswordData((prev) => ({ ...prev, password: newPassword }));

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

    // If password section is expanded, require strong password
    if (showPasswordSection) {
      if (passwordData.password && !passwordStrength.isStrong) {
        setError("Password must meet all 5 strength requirements.");
        return;
      }

      if (passwordData.password !== passwordData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          name: formData.name,
          password: passwordData.password || undefined,
          confirmPassword: passwordData.confirmPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update account.");
        return;
      }

      router.push(
        `/admin/accounts?toastType=success&toastMessage=${encodeURIComponent("Account updated successfully.")}`
      );
      router.refresh();
    } catch {
      setError("Unable to update account. Please try again.");
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
        <h1 className="mb-6 text-2xl font-semibold text-text-default">Edit Account</h1>

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

          {/* Password Section Toggle */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-4 py-2.5 text-sm font-semibold text-text-default hover:bg-surface transition"
            >
              {showPasswordSection ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              Change Password
            </button>

            {showPasswordSection && (
              <div className="space-y-4 rounded-xl border border-border bg-surface-soft p-4">
                <PasswordStrengthIndicator
                  password={passwordData.password}
                  onChange={handlePasswordChange}
                />

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-default">
                    Confirm Password <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    placeholder="Confirm new password"
                    required
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                  />
                  {passwordData.confirmPassword &&
                    passwordData.password !== passwordData.confirmPassword && (
                      <p className="text-xs text-error">Passwords do not match</p>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                loading ||
                (showPasswordSection &&
                  passwordData.password !== "" &&
                  (!passwordStrength.isStrong ||
                    (passwordData.confirmPassword !== "" &&
                      passwordData.password !== passwordData.confirmPassword)))
              }
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
