import { NextResponse } from "next/server";
import type { ApiResult } from "@/types/api";

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: string, status = 400, code?: string, details?: unknown): NextResponse<ApiResult<never>> {
  return NextResponse.json({ success: false, error, code, details }, { status });
}
