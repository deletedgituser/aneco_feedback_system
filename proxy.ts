import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

type SessionPayload = {
  sid: string;
  role: "admin" | "personnel";
};

function decodeSessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET ?? "") as SessionPayload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/forms") &&
    !pathname.startsWith("/responses") &&
    !pathname.startsWith("/admin")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("aneco_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeSessionToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/dashboard") && payload.role !== "personnel") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/forms") && payload.role !== "personnel") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/responses") && payload.role !== "personnel") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/forms/:path*", "/responses/:path*", "/admin/:path*"],
};
