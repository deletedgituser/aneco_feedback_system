"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type LoginResponse = {
  message?: string;
  redirectTo?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.message ?? "Login failed.");
        return;
      }

      const redirectUrl = data.redirectTo ? data.redirectTo : "/dashboard";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Unable to login right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-text-default">Username or email</span>
        <input
          type="text"
          value={usernameOrEmail}
          onChange={(event) => setUsernameOrEmail(event.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          required
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-text-default">Password</span>
        <div className="relative flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-10 text-sm text-text-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-text-muted hover:text-text-default transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      {error ? <p className="text-sm text-error-fg">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
