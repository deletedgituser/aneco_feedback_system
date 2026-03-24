"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  label?: string;
  className?: string;
  iconOnly?: boolean;
};

export function LogoutButton({ label = "Logout", className = "", iconOnly = false }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login?toastType=success&toastMessage=Logged+out+successfully");
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
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-default bg-surface px-3 py-2 text-sm font-semibold text-text-default transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      <LogOut size={16} />
      {iconOnly ? null : loading ? "Signing out..." : label}
    </button>
  );
}
