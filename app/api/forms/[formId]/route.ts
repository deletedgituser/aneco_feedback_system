import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";
import { deleteFormWithDependents } from "@/lib/services/forms";

async function requireAdminSession() {
  const payload = await getSessionPayload();
  if (!payload?.sid || payload.role !== "admin" || !payload.adminId) {
    return null;
  }
  const active = await isSessionActive(payload.sid);
  return active ? payload : null;
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/forms/[formId]">) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { formId: formIdParam } = await ctx.params;
  const formId = Number(formIdParam);
  if (!Number.isInteger(formId) || formId <= 0) {
    return NextResponse.json({ message: "Invalid form id" }, { status: 400 });
  }

  const result = await deleteFormWithDependents(formId);
  if (!result.deleted) {
    return NextResponse.json({ message: "Form not found" }, { status: 404 });
  }

  await logAuditEvent({
    actorRole: "admin",
    actorId: session.adminId,
    actionType: "form.delete",
    targetType: "form",
    targetId: formId,
    metadata: result,
  });

  revalidatePath("/admin/forms");
  revalidatePath("/admin/dashboard");
  revalidatePath("/kiosk");

  return NextResponse.json({ message: "Form deleted successfully", ...result });
}
