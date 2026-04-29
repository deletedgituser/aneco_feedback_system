export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type UserRole = "admin" | "personnel";

export interface SessionPayload {
  sid: string;
  role: UserRole;
  adminId?: number;
  personnelId?: number;
}
