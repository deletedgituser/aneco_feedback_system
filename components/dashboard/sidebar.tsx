"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, ScrollText, Users } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-border-default bg-surface transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-border-default px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="ANECO logo" width={30} height={30} className="h-8 w-8 object-contain" priority />
          {!collapsed ? <span className="text-sm font-semibold text-text-default">{title}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-md border border-border-default px-2 py-1 text-xs font-medium text-text-default hover:bg-brand-secondary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {(() => {
            const bestMatch = items.reduce((best, item) => {
              const isMatch = pathname === item.href || pathname.startsWith(`${item.href}/`);
              if (!isMatch) return best;
              if (item.href.length > best.href.length) {
                return item;
              }
              return best;
            }, { href: "", label: "", icon: "dashboard" as const });

            return items.map((item) => {
              const Icon = navIconMap[item.icon];
              const active = item.href === bestMatch.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-brand-secondary text-text-default"
                        : "text-text-default hover:bg-brand-primary-soft hover:text-text-default"
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    {collapsed ? null : item.label}
                  </Link>
                </li>
              );
            });
          })()}
        </ul>
      </nav>

      <div className="border-t border-border-default p-3">
        <LogoutButton
          label={logoutLabel}
          iconOnly={collapsed}
          className={collapsed ? "aspect-square px-0" : ""}
        />
      </div>
    </aside>
  );
}
