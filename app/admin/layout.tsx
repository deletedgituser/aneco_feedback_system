import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getSessionPayload } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const adminItems = [
  { href: "/admin", label: "Accounts", icon: "accounts" as const },
  { href: "/admin/logs", label: "Logs", icon: "logs" as const },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionPayload();
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
          <AdminHeader />

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
