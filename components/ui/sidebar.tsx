"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type SidebarProps = {
  title: string;
  items: SidebarItem[];
  footer?: React.ReactNode;
};

export function AppSidebar({ title, items, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-[220px] p-3">
      <div className="flex h-full flex-col rounded-3xl border border-border bg-sidebar p-3 text-text-inverse">
        <div className="px-3 pb-4 pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/75">{title}</h2>
        </div>
        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-in-out",
                  isActive
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-white/80 hover:bg-white/15 hover:text-white",
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {footer ? <div className="mt-3 border-t border-white/20 pt-3">{footer}</div> : null}
      </div>
    </aside>
  );
}
