import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type UserRole = "admin" | "personnel";

type SessionPayload = {
  sid: string;
  role: UserRole;
  adminId?: number;
  personnelId?: number;
};

const SESSION_COOKIE = "aneco_session";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable.");
  }
  return secret;
}

export async function createSession(input: {
  role: UserRole;
  adminId?: number;
  personnelId?: number;
}): Promise<string> {
  const tokenId = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenId,
      role: input.role,
      adminId: input.adminId,
      personnelId: input.personnelId,
      expiresAt,
    },
  });

  const payload: SessionPayload = {
    sid: tokenId,
    role: input.role,
    adminId: input.adminId,
    personnelId: input.personnelId,
  };

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as jwt.SignOptions["expiresIn"];

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "lax" : "lax", // localhost & network-safe in dev
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function revokeSession(tokenId: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      tokenId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function isSessionActive(tokenId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { tokenId },
  });

  if (!session) {
    return false;
  }

  if (session.revokedAt) {
    return false;
  }

  return session.expiresAt > new Date();
}
