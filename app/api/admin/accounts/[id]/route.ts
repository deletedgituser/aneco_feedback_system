import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { parsePositiveInt } from "@/lib/api/request";
import { requireRequestSession } from "@/lib/api/auth";
import { getPersonnelAccount, updatePersonnelAccount } from "@/lib/services/admin-account-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionResult = await requireRequestSession(request, ["admin"]);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const { id } = await params;
    const personnelId = parsePositiveInt(id);
    if (!personnelId) {
      return apiError("Invalid personnel ID", 400, "INVALID_PERSONNEL_ID");
    }

    const personnel = await getPersonnelAccount(personnelId);

    if (!personnel) {
      return apiError("Personnel account not found", 404, "PERSONNEL_NOT_FOUND");
    }

    return apiSuccess(personnel);
  } catch (error) {
    console.error("Error fetching personnel account:", error);
    return apiError("Internal server error", 500, "INTERNAL_SERVER_ERROR");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionResult = await requireRequestSession(request, ["admin"]);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const { id } = await params;
    const personnelId = parsePositiveInt(id);
    if (!personnelId) {
      return apiError("Invalid personnel ID", 400, "INVALID_PERSONNEL_ID");
    }

    const body = await request.json();
    const result = await updatePersonnelAccount(body, personnelId, sessionResult.payload.adminId as number);
    if (!result.ok) {
      return apiError(result.error, result.status, "UPDATE_ACCOUNT_FAILED");
    }

    return apiSuccess({ message: "Account updated successfully" });
  } catch (error) {
    console.error("Error updating account:", error);
    return apiError("Internal server error", 500, "INTERNAL_SERVER_ERROR");
  }
}
