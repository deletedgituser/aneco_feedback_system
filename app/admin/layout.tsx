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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar title="Admin Panel" items={adminItems} logoutLabel="Admin Logout" userInfo={userInfo} />
      <section className="h-screen flex-1 overflow-y-auto pt-2 pb-4 px-4 md:pt-3 md:pb-5 md:px-5">
        {toastType && toastMessage ? <FlashToast type={toastType} message={toastMessage} /> : null}
        <div className="mb-2 flex items-center justify-end gap-1">
          {userInfo ? (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              <User size={18} />
              <span>{userInfo.role === "admin" ? "Admin" : "Personnel"}</span>
              <span className="text-slate-500">{userInfo.displayName}</span>
            </div>
          ) : null}
        </div>
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
