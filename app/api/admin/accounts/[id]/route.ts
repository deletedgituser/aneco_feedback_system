import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit";
import { validateEditAccountInput } from "@/lib/admin-account";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionPayload();
    if (!session?.adminId || session.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const personnelId = parseInt(id, 10);
    if (!Number.isInteger(personnelId) || personnelId <= 0) {
      return NextResponse.json({ message: "Invalid personnel ID" }, { status: 400 });
    }

    const personnel = await prisma.personnel.findUnique({
      where: { personnelId },
      select: {
        personnelId: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!personnel) {
      return NextResponse.json({ message: "Personnel account not found" }, { status: 404 });
    }

    return NextResponse.json(personnel);
  } catch (error) {
    console.error("Error fetching personnel account:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionPayload();
    if (!session?.adminId || session.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const personnelId = parseInt(id, 10);

    if (!Number.isInteger(personnelId) || personnelId <= 0) {
      return NextResponse.json(
        { message: "Invalid personnel ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    let validated;
    try {
      validated = validateEditAccountInput(body);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Validation failed";
      return NextResponse.json({ message }, { status: 400 });
    }

    const { username, email, name, password } = validated;

    // Check if personnel exists
    const existing = await prisma.personnel.findUnique({
      where: { personnelId },
      select: { personnelId: true, email: true, username: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Personnel account not found" },
        { status: 404 }
      );
    }

    // Check if new email is already taken by someone else
    if (email !== existing.email) {
      const emailTaken = await prisma.personnel.findUnique({
        where: { email },
        select: { personnelId: true },
      });

      if (emailTaken) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Check if new username is already taken by someone else
    if (username !== existing.username) {
      const usernameTaken = await prisma.personnel.findUnique({
        where: { username },
        select: { personnelId: true },
      });

      if (usernameTaken) {
        return NextResponse.json(
          { message: "Username already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: { username: string; email: string; name: string; passwordHash?: string } = {
      username,
      email,
      name,
    };

    // If password is provided, hash it
    if (password) {
      const passwordHash = await hashPassword(password);
      updateData.passwordHash = passwordHash;

      // Update personnel
      await prisma.personnel.update({
        where: { personnelId },
        data: updateData,
      });

      // Record password history
      await prisma.passwordHistory.create({
        data: {
          personnelId,
          passwordHash,
        },
      });

      // Log audit event
      await logAuditEvent({
        actorRole: "admin",
        actorId: session.adminId,
        actionType: "UPDATE_ACCOUNT_WITH_PASSWORD",
        targetType: "Personnel",
        targetId: personnelId,
        metadata: { email, name },
      });
    } else {
      // Update personnel without password
      await prisma.personnel.update({
        where: { personnelId },
        data: updateData,
      });

      // Log audit event
      await logAuditEvent({
        actorRole: "admin",
        actorId: session.adminId,
        actionType: "UPDATE_ACCOUNT",
        targetType: "Personnel",
        targetId: personnelId,
        metadata: { email, name },
      });
    }

    return NextResponse.json(
      { message: "Account updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
