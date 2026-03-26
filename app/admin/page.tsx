import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getSessionPayload } from "@/lib/auth/session";
import { hashPassword, validatePasswordComplexity, verifyPassword } from "@/lib/auth/password";
import { redirect } from "next/navigation";
import { FlashToast } from "@/components/ui/flash-toast";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

function buildStrongTemporaryPassword() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `Temp@${random}aA`;
}

function redirectWithToast(type: "success" | "error", message: string): never {
  const query = new URLSearchParams({
    toastType: type,
    toastMessage: message,
  });
  redirect(`/admin?${query.toString()}`);
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

  async function createPersonnelAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirectWithToast("error", "Unauthorized action.");
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      redirectWithToast("error", "Name, email, and password are required.");
    }

    const complexityIssues = validatePasswordComplexity(password);
    if (complexityIssues.length > 0) {
      redirectWithToast("error", complexityIssues[0]);
    }

    const existing = await prisma.personnel.findUnique({
      where: { email },
      select: { personnelId: true },
    });

    if (existing) {
      redirectWithToast("error", "Email already exists.");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.personnel.create({
      data: {
        name,
        email,
        passwordHash,
        createdByAdmin: session.adminId,
      },
      select: {
        personnelId: true,
      },
    });

    await prisma.passwordHistory.create({
      data: {
        personnelId: user.personnelId,
        passwordHash,
      },
    });

    await logAuditEvent({
      actorRole: "admin",
      actorId: session.adminId,
      actionType: "personnel.create",
      targetType: "personnel",
      targetId: user.personnelId,
      metadata: {
        email,
      },
    });

    redirectWithToast("success", "Personnel account created successfully.");
  }

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

  async function resetPersonnelPasswordAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirectWithToast("error", "Unauthorized action.");
    }

    const personnelId = Number(formData.get("personnelId"));
    if (!Number.isInteger(personnelId) || personnelId <= 0) {
      redirectWithToast("error", "Invalid personnel account.");
    }

    const explicitPassword = String(formData.get("newPassword") ?? "").trim();
    let nextPassword = explicitPassword || buildStrongTemporaryPassword();

    const complexityIssues = validatePasswordComplexity(nextPassword);
    if (complexityIssues.length > 0) {
      redirectWithToast("error", complexityIssues[0]);
    }

    const recentHistory = await prisma.passwordHistory.findMany({
      where: { personnelId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { passwordHash: true },
    });

    const isReusedPassword = async (candidate: string): Promise<boolean> => {
      for (const item of recentHistory) {
        const reused = await verifyPassword(candidate, item.passwordHash);
        if (reused) {
          return true;
        }
      }
      return false;
    };

    if (explicitPassword) {
      const reused = await isReusedPassword(nextPassword);
      if (reused) {
        redirectWithToast("error", "New password must not match any of the last 5 passwords.");
      }
    } else {
      let attempts = 0;
      while (await isReusedPassword(nextPassword)) {
        attempts += 1;
        if (attempts >= 10) {
          redirectWithToast("error", "Unable to generate a unique temporary password. Please try again.");
        }
        nextPassword = buildStrongTemporaryPassword();
      }
    }

    const passwordHash = await hashPassword(nextPassword);

    const updatedPersonnel = await prisma.personnel.update({
      where: { personnelId },
      data: {
        passwordHash,
      },
      select: {
        passwordHash: true,
      },
    });

    await prisma.passwordHistory.create({
      data: {
        personnelId,
        passwordHash,
      },
    });

    const verifyAfter = await verifyPassword(nextPassword, updatedPersonnel.passwordHash);
    if (!verifyAfter) {
      redirectWithToast("error", "Failed to confirm updated password. Please try again.");
    }

    await logAuditEvent({
      actorRole: "admin",
      actorId: session.adminId,
      actionType: explicitPassword ? "personnel.password.changed" : "personnel.password.reset",
      targetType: "personnel",
      targetId: personnelId,
      metadata: {
        resetMode: explicitPassword ? "custom" : "generated",
      },
    });

    const successMessage = explicitPassword
      ? "Personnel password has been updated."
      : `Personnel temporary password has been generated: ${nextPassword}`;

    redirectWithToast("success", successMessage);
  }

  return (
    <section className="space-y-6">
      {query.toastType && query.toastMessage ? (
        <FlashToast type={query.toastType} message={query.toastMessage} />
      ) : null}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-default">Personnel Accounts</h1>
      </div>

      <form action={createPersonnelAction} className="grid gap-3 rounded-2xl border border-border bg-surface-soft p-5 md:grid-cols-4">
        <input
          name="name"
          placeholder="Full name"
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Initial password"
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
          required
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Add Personnel
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-soft">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {personnel.map((user: { personnelId: number; name: string; email: string; isActive: boolean }) => (
              <tr key={user.personnelId}>
                <td className="px-4 py-3 text-text-default">{user.name}</td>
                <td className="px-4 py-3 text-text-default">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      user.isActive ? "bg-success/20 text-success" : "bg-danger/18 text-danger"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
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
                    <form action={resetPersonnelPasswordAction} className="flex items-center gap-2">
                      <input type="hidden" name="personnelId" value={user.personnelId} />
                      <input
                        name="newPassword"
                        placeholder="Enter new password (leave blank to auto-generate)"
                        className="w-56 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-border px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-surface-soft"
                      >
                        Change Password
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
