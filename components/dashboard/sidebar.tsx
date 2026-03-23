"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, ScrollText, Users } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

type NavIcon = "dashboard" | "forms" | "accounts" | "logs";

const navIconMap: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  forms: ClipboardList,
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
};

export function Sidebar({ title, items, logoutLabel = "Logout" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed ? <span className="text-sm font-semibold text-slate-700">{title}</span> : null}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = navIconMap[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-cyan-50 text-cyan-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {collapsed ? null : item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <LogoutButton
          label={logoutLabel}
          iconOnly={collapsed}
          className={collapsed ? "aspect-square px-0" : ""}
        />
      </div>
    </aside>
  );
}
