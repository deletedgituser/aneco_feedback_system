import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRequestSession } from "@/lib/api/auth";
import { createPersonnelAccount } from "@/lib/services/admin-account-service";

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireRequestSession(request, ["admin"]);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const body = await request.json();
    const createResult = await createPersonnelAccount(body, sessionResult.payload.adminId as number);
    if (!createResult.ok) {
      return apiError(createResult.error, createResult.status, "CREATE_ACCOUNT_FAILED");
    }

    return apiSuccess(
      { message: "Account created successfully", personnelId: createResult.personnelId },
      201,
    );
  } catch (error) {
    console.error("Error creating account:", error);
    return apiError("Internal server error", 500, "INTERNAL_SERVER_ERROR");
  }
}
