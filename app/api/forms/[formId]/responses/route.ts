import { NextRequest, NextResponse } from "next/server";
import { getFormResponseReport, parsePage, parseResponseFilters } from "@/lib/services/response-report";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";

async function requireDashboardSession() {
  const payload = await getSessionPayload();
  if (!payload?.sid || (payload.role !== "personnel" && payload.role !== "admin")) {
    return null;
  }
  const active = await isSessionActive(payload.sid);
  return active ? payload : null;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/forms/[formId]/responses">) {
  const session = await requireDashboardSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { formId: formIdParam } = await ctx.params;
  const formId = Number(formIdParam);
  if (!Number.isInteger(formId) || formId <= 0) {
    return NextResponse.json({ message: "Invalid form id" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const report = await getFormResponseReport({
    formId,
    page: parsePage(searchParams.get("page") ?? undefined),
    filters: parseResponseFilters({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      respondent: searchParams.get("respondent") ?? undefined,
      assistedEmployee: searchParams.get("assistedEmployee") ?? undefined,
    }),
  });

  if (!report) {
    return NextResponse.json({ message: "Form not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
