import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { loginWithCredentials } from "@/lib/services/auth-service";

type LoginBody = {
  usernameOrEmail?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;

  if (!body.usernameOrEmail || !body.password) {
    return apiError("Username/email and password are required.", 400, "VALIDATION_ERROR");
  }

  const result = await loginWithCredentials(body.usernameOrEmail, body.password);
  if (result === "deactivated") {
    return apiError("Account is deactivated.", 403, "ACCOUNT_DEACTIVATED");
  }

  if (!result) {
    return apiError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
  }

  return apiSuccess(result);
}
