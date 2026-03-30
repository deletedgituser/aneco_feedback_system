"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export function AdminHeader() {
  const pathname = usePathname();

  function getSectionTitle(path: string): string {
    if (path.includes("/logs")) {
      return "Logs";
    }
    if (path.includes("/accounts")) {
      return "Accounts";
    }
    return "Admin";
  }

  const sectionTitle = getSectionTitle(pathname);

  return (
    <header className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">ANECO Feedback System</p>
            <p className="text-lg font-semibold text-text-default">{sectionTitle}</p>
          </div>
        </div>
        <Breadcrumbs />
      </div>
    </header>
  );
}
