"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  label?: string;
  className?: string;
  iconOnly?: boolean;
  collapseLabelOnDesktop?: boolean;
  tone?: "default" | "sidebar";
};

export function LogoutButton({ label = "Logout", className = "", iconOnly = false, collapseLabelOnDesktop = false, tone = "default" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login?toastType=success&toastMessage=Logged+out+successfully.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      aria-label={loading ? "Signing out" : label}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
        tone === "sidebar"
          ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
          : "border-border-default bg-surface text-text-default hover:bg-brand-secondary/25"
      } ${className}`}
    >
      <LogOut size={16} />
      {iconOnly ? null : <span className={collapseLabelOnDesktop ? "md:hidden" : undefined}>{loading ? "Signing out..." : label}</span>}
    </button>
  );
}
