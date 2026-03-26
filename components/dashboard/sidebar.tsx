"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardList, LayoutDashboard, Menu, ScrollText, Users, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/cn";

type NavIcon = "dashboard" | "forms" | "responses" | "accounts" | "logs";

const navIconMap: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  forms: ClipboardList,
  responses: ScrollText,
  accounts: Users,
  logs: ScrollText,
};

type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

type SidebarProps = {
  title: string;
  items: NavItem[];
  logoutLabel?: string;
  userInfo?: {
    role: "admin" | "personnel";
    displayName: string;
  };
};

export function Sidebar({ title, items, logoutLabel = "Logout", userInfo }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = userInfo?.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") ?? "AN";

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-primary shadow-sm md:hidden"
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-surface-dark/35 md:hidden"
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-3 left-3 z-40 w-[220px] rounded-3xl bg-sidebar text-text-inverse shadow-2xl transition-transform duration-300",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-[130%]",
        )}
      >
        <div className="flex h-full flex-col p-4">
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="mb-3 flex items-center gap-3">
              <Image src="/logo.png" alt="ANECO logo" width={34} height={34} className="h-9 w-9 rounded-full bg-white/90 p-1" priority />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">{title}</p>
                <p className="text-sm font-semibold text-white">{userInfo?.displayName ?? "ANECO User"}</p>
              </div>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
              {initials}
            </div>
          </div>

          <nav className="mt-4 flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {(() => {
                const bestMatch = items.reduce(
                  (best, item) => {
                    const isMatch = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    if (!isMatch) return best;
                    if (item.href.length > best.href.length) {
                      return item;
                    }
                    return best;
                  },
                  { href: "", label: "", icon: "dashboard" as const },
                );

                return items.map((item) => {
                  const Icon = navIconMap[item.icon];
                  const active = item.href === bestMatch.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-surface text-text-primary"
                            : "text-white/85 hover:bg-white/15 hover:text-white",
                        )}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                });
              })()}
            </ul>
          </nav>

          <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/80">
              <p className="font-semibold tracking-wide">Active Session</p>
              <p className="mt-1">{userInfo?.role === "admin" ? "Administrator" : "Personnel"}</p>
            </div>
            <LogoutButton label={logoutLabel} tone="sidebar" />
          </div>
        </div>
      </aside>
      <div className="hidden w-[236px] shrink-0 md:block" aria-hidden="true" />
    </>
  );
}
