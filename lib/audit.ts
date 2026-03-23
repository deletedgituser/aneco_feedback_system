import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorRole: "admin" | "personnel" | "kiosk" | "system";
  actorId?: number;
  actionType: string;
  targetType: string;
  targetId?: number;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorRole: input.actorRole,
      actorId: input.actorId,
      actionType: input.actionType,
      targetType: input.targetType,
      targetId: input.targetId,
      metadataJson: input.metadata,
    },
  });
}
