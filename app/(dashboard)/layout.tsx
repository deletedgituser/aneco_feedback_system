import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

const dashboardItems = [
  { href: "/dashboard", label: "Analytics", icon: "dashboard" as const },
  { href: "/forms", label: "Forms", icon: "forms" as const },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar title="Personnel Panel" items={dashboardItems} logoutLabel="Logout" />
      <section className="h-screen flex-1 overflow-y-auto p-4 md:p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <Breadcrumbs />
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </section>
    </div>
  );
}
