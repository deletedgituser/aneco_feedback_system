import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionPayload, revokeSession } from "@/lib/auth/session";

export async function POST() {
  const payload = await getSessionPayload();
  if (payload?.sid) {
    await revokeSession(payload.sid);
  }

  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
