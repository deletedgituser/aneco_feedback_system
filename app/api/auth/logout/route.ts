import { apiSuccess } from "@/lib/api/response";
import { getSessionPayload } from "@/lib/auth/session";
import { logoutCurrentSession } from "@/lib/services/auth-service";

export async function POST() {
  const payload = await getSessionPayload();
  await logoutCurrentSession(payload?.sid);

  return apiSuccess({ ok: true });
}
