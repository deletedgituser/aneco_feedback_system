import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie, clearSessionCookie, revokeSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export interface LoginResult {
  role: "admin" | "personnel";
  redirectTo: string;
}

export async function loginWithCredentials(usernameOrEmailRaw: string, password: string): Promise<LoginResult | null | "deactivated"> {
  const usernameOrEmail = usernameOrEmailRaw.trim();
  const normalizedInput = usernameOrEmail.toLowerCase();

  const [admin, personnel] = await Promise.all([
    prisma.admin.findUnique({
      where: { username: usernameOrEmail },
    }),
    prisma.personnel.findFirst({
      where: {
        OR: [
          { email: normalizedInput },
          { username: usernameOrEmail },
          { username: normalizedInput },
          { name: usernameOrEmail },
          { name: normalizedInput },
        ],
      },
    }),
  ]);

  if (admin) {
    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      await logAuditEvent({
        actorRole: "system",
        actionType: "auth.login.failed",
        targetType: "admin",
        metadata: { username: usernameOrEmail },
      });
      return null;
    }

    const token = await createSession({
      role: "admin",
      adminId: admin.adminId,
    });
    await setSessionCookie(token);

    await logAuditEvent({
      actorRole: "admin",
      actorId: admin.adminId,
      actionType: "auth.login.success",
      targetType: "admin",
      targetId: admin.adminId,
    });

    return { role: "admin", redirectTo: "/admin" };
  }

  if (personnel) {
    if (!personnel.isActive) {
      return "deactivated";
    }

    const valid = await verifyPassword(password, personnel.passwordHash);
    if (!valid) {
      await logAuditEvent({
        actorRole: "system",
        actionType: "auth.login.failed",
        targetType: "personnel",
        metadata: { email: normalizedInput },
      });
      return null;
    }

    const token = await createSession({
      role: "personnel",
      personnelId: personnel.personnelId,
    });
    await setSessionCookie(token);

    await logAuditEvent({
      actorRole: "personnel",
      actorId: personnel.personnelId,
      actionType: "auth.login.success",
      targetType: "personnel",
      targetId: personnel.personnelId,
    });

    return { role: "personnel", redirectTo: "/dashboard" };
  }

  await logAuditEvent({
    actorRole: "system",
    actionType: "auth.login.failed",
    targetType: "unknown",
    metadata: { value: usernameOrEmail },
  });

  return null;
}

export async function logoutCurrentSession(payloadSid?: string): Promise<void> {
  if (payloadSid) {
    await revokeSession(payloadSid);
  }

  await clearSessionCookie();
}
