import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

type LoginBody = {
  usernameOrEmail?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;

  if (!body.usernameOrEmail || !body.password) {
    return NextResponse.json(
      { message: "Username/email and password are required." },
      { status: 400 },
    );
  }

  const usernameOrEmail = body.usernameOrEmail.trim();

  const [admin, personnel] = await Promise.all([
    prisma.admin.findUnique({
      where: { username: usernameOrEmail },
    }),
    prisma.personnel.findUnique({
      where: { email: usernameOrEmail },
    }),
  ]);

  if (admin) {
    const valid = await verifyPassword(body.password, admin.passwordHash);
    if (!valid) {
      await logAuditEvent({
        actorRole: "system",
        actionType: "auth.login.failed",
        targetType: "admin",
        metadata: { username: usernameOrEmail },
      });
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
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

    return NextResponse.json({ role: "admin", redirectTo: "/admin" });
  }

  if (personnel) {
    if (!personnel.isActive) {
      return NextResponse.json({ message: "Account is deactivated." }, { status: 403 });
    }

    const valid = await verifyPassword(body.password, personnel.passwordHash);
    if (!valid) {
      await logAuditEvent({
        actorRole: "system",
        actionType: "auth.login.failed",
        targetType: "personnel",
        metadata: { email: usernameOrEmail },
      });
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
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

    return NextResponse.json({ role: "personnel", redirectTo: "/dashboard" });
  }

  await logAuditEvent({
    actorRole: "system",
    actionType: "auth.login.failed",
    targetType: "unknown",
    metadata: { value: usernameOrEmail },
  });

  return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
}
