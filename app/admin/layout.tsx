import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { FlashToast } from "@/components/ui/flash-toast";
import { getSessionPayload } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";

const adminItems = [
  { href: "/admin", label: "Accounts", icon: "accounts" as const },
  { href: "/admin/logs", label: "Logs", icon: "logs" as const },
];

export default async function AdminLayout({
  children,
  searchParams,
}: {
  children: ReactNode;
  searchParams?: { toastType?: "success" | "error"; toastMessage?: string };
}) {
  const session = await getSessionPayload();
  const toastType = searchParams?.toastType;
  const toastMessage = searchParams?.toastMessage;
  let userInfo: { role: "admin" | "personnel"; displayName: string } | undefined;

  if (session?.role === "admin" && session.adminId) {
    const admin = await prisma.admin.findUnique({
      where: { adminId: session.adminId },
      select: { username: true },
    });

    if (admin) {
      userInfo = { role: "admin", displayName: admin.username };
    }
  } else if (session?.role === "personnel" && session.personnelId) {
    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { name: true },
    });

    if (personnel) {
      userInfo = { role: "personnel", displayName: personnel.name };
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar title="Admin Panel" items={adminItems} logoutLabel="Admin Logout" userInfo={userInfo} />
      <section className="min-h-screen flex-1 overflow-y-auto px-4 pb-6 pt-16 md:px-6 md:pb-8 md:pt-6">
        <div className="space-y-6">
          {toastType && toastMessage ? <FlashToast type={toastType} message={toastMessage} /> : null}

          <header className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">ANECO Feedback System</p>
                <Breadcrumbs />
              </div>
              {userInfo ? (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-3 py-2 text-sm font-medium text-text-default">
                  <User size={16} />
                  <span>{userInfo.role === "admin" ? "Admin" : "Personnel"}</span>
                  <span className="text-text-muted">{userInfo.displayName}</span>
                </div>
              ) : null}
            </div>
          </header>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
