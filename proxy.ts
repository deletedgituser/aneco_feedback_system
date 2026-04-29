import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/token";
import type { SessionPayload } from "@/types/api";

const API_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const API_HEADERS = "Authorization, Content-Type, X-Requested-With";

function getAllowedOrigins(): string[] {
  const envValue = process.env.CORS_ALLOWED_ORIGINS;
  if (!envValue) {
    return [];
  }

  return envValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getCorsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  const allowedOrigins = getAllowedOrigins();
  const allowAnyOrigin = allowedOrigins.includes("*");
  const allowOrigin =
    origin && (allowAnyOrigin || allowedOrigins.includes(origin))
      ? origin
      : allowedOrigins[0] ?? "";

  if (allowOrigin) {
    headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", API_METHODS);
  headers.set("Access-Control-Allow-Headers", API_HEADERS);

  return headers;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const headers = getCorsHeaders(request.headers.get("origin"));

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers });
    }

    const response = NextResponse.next();
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

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

  const payload = verifySessionToken(token);
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
  matcher: ["/api/:path*", "/dashboard/:path*", "/forms/:path*", "/responses/:path*", "/admin/:path*"],
};
