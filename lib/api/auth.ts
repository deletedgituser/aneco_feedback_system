import { apiError } from "@/lib/api/response";
import { getSessionPayloadFromRequest, isSessionActive } from "@/lib/auth/session";
import type { SessionPayload, UserRole } from "@/types/api";

function hasRequiredActorId(payload: SessionPayload): boolean {
  if (payload.role === "admin") {
    return Boolean(payload.adminId);
  }

  return Boolean(payload.personnelId);
}

export async function getRequestSessionPayload(request: Request): Promise<SessionPayload | null> {
  return getSessionPayloadFromRequest(request);
}

export async function requireRequestSession(
  request: Request,
  allowedRoles: UserRole[],
): Promise<{ ok: true; payload: SessionPayload } | { ok: false; response: ReturnType<typeof apiError> }> {
  const payload = await getRequestSessionPayload(request);
  if (!payload) {
    return { ok: false, response: apiError("Unauthorized", 401, "UNAUTHORIZED") };
  }

  if (!allowedRoles.includes(payload.role)) {
    return { ok: false, response: apiError("Forbidden", 403, "FORBIDDEN") };
  }

  if (!payload.sid || !hasRequiredActorId(payload)) {
    return { ok: false, response: apiError("Unauthorized", 401, "INVALID_SESSION") };
  }

  const active = await isSessionActive(payload.sid);
  if (!active) {
    return { ok: false, response: apiError("Session expired", 401, "SESSION_INACTIVE") };
  }

  return { ok: true, payload };
}
