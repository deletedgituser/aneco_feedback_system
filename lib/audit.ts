import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  actorRole: "admin" | "personnel" | "kiosk" | "system";
  actorId?: number;
  actionType: string;
  targetType: string;
  targetId?: number;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(input: AuditInput): Promise<void> {
  const metadataJson = input.metadata
    ? (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue)
    : undefined;

  await prisma.auditLog.create({
    data: {
      actorRole: input.actorRole,
      actorId: input.actorId,
      actionType: input.actionType,
      targetType: input.targetType,
      targetId: input.targetId,
      metadataJson,
    },
  });
}
