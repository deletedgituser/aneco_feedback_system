import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit";
import { validateAddAccountInput, validateEditAccountInput } from "@/lib/admin-account";

export async function createPersonnelAccount(body: unknown, adminId: number) {
  const validated = validateAddAccountInput(body);
  const { username, email, name, password } = validated;

  const existingEmailUser = await prisma.personnel.findUnique({
    where: { email },
    select: { personnelId: true },
  });
  if (existingEmailUser) {
    return { ok: false as const, error: "Email already exists", status: 409 };
  }

  const existingUsernameUser = await prisma.personnel.findUnique({
    where: { username },
    select: { personnelId: true },
  });
  if (existingUsernameUser) {
    return { ok: false as const, error: "Username already exists", status: 409 };
  }

  const passwordHash = await hashPassword(password);

  const newPersonnel = await prisma.personnel.create({
    data: {
      username,
      name,
      email,
      passwordHash,
      createdByAdmin: adminId,
    },
    select: { personnelId: true },
  });

  await prisma.passwordHistory.create({
    data: {
      personnelId: newPersonnel.personnelId,
      passwordHash,
    },
  });

  await logAuditEvent({
    actorRole: "admin",
    actorId: adminId,
    actionType: "CREATE_ACCOUNT",
    targetType: "Personnel",
    targetId: newPersonnel.personnelId,
    metadata: { username, email, name },
  });

  return { ok: true as const, personnelId: newPersonnel.personnelId };
}

export async function getPersonnelAccount(personnelId: number) {
  return prisma.personnel.findUnique({
    where: { personnelId },
    select: {
      personnelId: true,
      username: true,
      name: true,
      email: true,
      isActive: true,
    },
  });
}

export async function updatePersonnelAccount(body: unknown, personnelId: number, adminId: number) {
  const validated = validateEditAccountInput(body);
  const { username, email, name, password } = validated;

  const existing = await prisma.personnel.findUnique({
    where: { personnelId },
    select: { personnelId: true, email: true, username: true },
  });

  if (!existing) {
    return { ok: false as const, error: "Personnel account not found", status: 404 };
  }

  if (email !== existing.email) {
    const emailTaken = await prisma.personnel.findUnique({
      where: { email },
      select: { personnelId: true },
    });

    if (emailTaken) {
      return { ok: false as const, error: "Email already exists", status: 409 };
    }
  }

  if (username !== existing.username) {
    const usernameTaken = await prisma.personnel.findUnique({
      where: { username },
      select: { personnelId: true },
    });

    if (usernameTaken) {
      return { ok: false as const, error: "Username already exists", status: 409 };
    }
  }

  const updateData: { username: string; email: string; name: string; passwordHash?: string } = {
    username,
    email,
    name,
  };

  if (password) {
    const passwordHash = await hashPassword(password);
    updateData.passwordHash = passwordHash;

    await prisma.personnel.update({
      where: { personnelId },
      data: updateData,
    });

    await prisma.passwordHistory.create({
      data: {
        personnelId,
        passwordHash,
      },
    });

    await logAuditEvent({
      actorRole: "admin",
      actorId: adminId,
      actionType: "UPDATE_ACCOUNT_WITH_PASSWORD",
      targetType: "Personnel",
      targetId: personnelId,
      metadata: { email, name },
    });
  } else {
    await prisma.personnel.update({
      where: { personnelId },
      data: updateData,
    });

    await logAuditEvent({
      actorRole: "admin",
      actorId: adminId,
      actionType: "UPDATE_ACCOUNT",
      targetType: "Personnel",
      targetId: personnelId,
      metadata: { email, name },
    });
  }

  return { ok: true as const };
}
