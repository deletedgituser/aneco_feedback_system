import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FlashToast } from "@/components/ui/flash-toast";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

function redirectWithToast(type: "success" | "error", message: string): never {
  const query = new URLSearchParams({
    toastType: type,
    toastMessage: message,
  });
  redirect(`/admin/accounts?${query.toString()}`);
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ toastType?: "success" | "error"; toastMessage?: string }>;
}) {
  const query = await searchParams;

  const personnel = await prisma.personnel.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  async function togglePersonnelStatusAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirectWithToast("error", "Unauthorized action.");
    }

    const personnelId = Number(formData.get("personnelId"));
    const nextStatus = String(formData.get("nextStatus")) === "true";

    if (!Number.isInteger(personnelId) || personnelId <= 0) {
      redirectWithToast("error", "Invalid personnel account.");
    }

    await prisma.personnel.update({
      where: { personnelId },
      data: {
        isActive: nextStatus,
      },
    });

    await logAuditEvent({
      actorRole: "admin",
      actorId: session.adminId,
      actionType: nextStatus ? "personnel.activate" : "personnel.deactivate",
      targetType: "personnel",
      targetId: personnelId,
    });

    redirectWithToast("success", nextStatus ? "Personnel account activated." : "Personnel account deactivated.");
  }

  async function deletePersonnelAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirectWithToast("error", "Unauthorized action.");
    }

    const personnelId = Number(formData.get("personnelId"));
    if (!Number.isInteger(personnelId) || personnelId <= 0) {
      redirectWithToast("error", "Invalid personnel account.");
    }

    const target = await prisma.personnel.findUnique({
      where: { personnelId },
      select: { personnelId: true },
    });

    if (!target) {
      redirectWithToast("error", "Personnel account not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.passwordHistory.deleteMany({ where: { personnelId } });
      await tx.session.deleteMany({ where: { personnelId } });
      await tx.form.updateMany({ where: { createdByPersonnelId: personnelId }, data: { createdByPersonnelId: null } });
      await tx.personnel.delete({ where: { personnelId } });
    });

    await logAuditEvent({
      actorRole: "admin",
      actorId: session.adminId,
      actionType: "personnel.delete",
      targetType: "personnel",
      targetId: personnelId,
    });

    redirectWithToast("success", "Personnel account deleted successfully.");
  }

  return (
    <section className="space-y-6">
      {query.toastType && query.toastMessage ? (
        <FlashToast type={query.toastType} message={query.toastMessage} />
      ) : null}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-default">Personnel Accounts</h1>
        <Link href="/admin/accounts/new">
          <Button variant="primary">Add Account</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-soft">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {personnel.map((user: { personnelId: number; username?: string; name: string; email: string; isActive: boolean }) => (
              <tr key={user.personnelId}>
                <td className="px-4 py-3 text-text-default">{user.name}</td>
                <td className="px-4 py-3 text-text-default">{user.username}</td>
                <td className="px-4 py-3 text-text-default">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      user.isActive ? "bg-success/20 text-success" : "bg-error/20 text-error"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/accounts/${user.personnelId}/edit`}>
                      <Button variant="secondary" className="text-xs px-2.5 py-1.5">
                        Edit
                      </Button>
                    </Link>
                    <form action={togglePersonnelStatusAction}>
                      <input type="hidden" name="personnelId" value={user.personnelId} />
                      <input type="hidden" name="nextStatus" value={String(!user.isActive)} />
                      <button
                        type="submit"
                        className="rounded-xl border border-border px-2.5 py-1.5 text-xs font-semibold text-text-default hover:bg-surface-soft"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deletePersonnelAction}>
                      <input type="hidden" name="personnelId" value={user.personnelId} />
                      <ConfirmDeleteButton formId={user.personnelId}>Delete</ConfirmDeleteButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {personnel.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                  No personnel accounts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
