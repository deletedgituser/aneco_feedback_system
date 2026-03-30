import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit";
import { validateAddAccountInput } from "@/lib/admin-account";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionPayload();
    if (!session?.adminId || session.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    let validated;
    try {
      validated = validateAddAccountInput(body);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Validation failed";
      return NextResponse.json({ message }, { status: 400 });
    }

    const { username, email, name, password } = validated;

    // Check if email already exists
    const existingEmailUser = await prisma.personnel.findUnique({
      where: { email },
      select: { personnelId: true },
    });
    if (existingEmailUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsernameUser = await prisma.personnel.findUnique({
      where: { username },
      select: { personnelId: true },
    });
    if (existingUsernameUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create personnel account
    const newPersonnel = await prisma.personnel.create({
      data: {
        username,
        name,
        email,
        passwordHash,
        createdByAdmin: session.adminId,
      },
      select: { personnelId: true },
    });

    // Record password history
    await prisma.passwordHistory.create({
      data: {
        personnelId: newPersonnel.personnelId,
        passwordHash,
      },
    });

    // Log audit event
    await logAuditEvent({
      actorRole: "admin",
      actorId: session.adminId,
      actionType: "CREATE_ACCOUNT",
      targetType: "Personnel",
      targetId: newPersonnel.personnelId,
      metadata: { username, email, name },
    });

    return NextResponse.json(
      { message: "Account created successfully", personnelId: newPersonnel.personnelId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
