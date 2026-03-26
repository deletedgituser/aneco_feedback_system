import { prisma } from "@/lib/prisma";

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  const adminIds = Array.from(
    new Set(
      logs
        .filter((log) => log.actorRole === "admin" && log.actorId)
        .map((log) => log.actorId as number)
        .concat(
          logs
            .filter((log) => log.targetType === "admin" && log.targetId)
            .map((log) => log.targetId as number),
        ),
    ),
  );
  const personnelIds = Array.from(
    new Set(
      logs
        .filter((log) => log.actorRole === "personnel" && log.actorId)
        .map((log) => log.actorId as number)
        .concat(
          logs
            .filter((log) => log.targetType === "personnel" && log.targetId)
            .map((log) => log.targetId as number),
        ),
    ),
  );

  const formIds = Array.from(
    new Set(
      logs
        .filter((log) => log.targetType === "form" && log.targetId)
        .map((log) => log.targetId as number),
    ),
  );

  const [admins, personnel, forms] = await Promise.all([
    adminIds.length > 0 ? prisma.admin.findMany({ where: { adminId: { in: adminIds } } }) : [],
    personnelIds.length > 0 ? prisma.personnel.findMany({ where: { personnelId: { in: personnelIds } } }) : [],
    formIds.length > 0 ? prisma.form.findMany({ where: { formId: { in: formIds } } }) : [],
  ]);

  const adminMap = new Map(admins.map((user) => [user.adminId, user.username]));
  const personnelMap = new Map(personnel.map((user) => [user.personnelId, user.name]));
  const formMap = new Map(forms.map((form) => [form.formId, form.title]));

  const formatActor = (log: { actorRole: string; actorId: number | null }) => {
    if (!log.actorId) return log.actorRole;

    const id = log.actorId;
    if (log.actorRole === "admin") {
      return `admin '${adminMap.get(id) ?? "unknown"}' (#${id})`;
    }
    if (log.actorRole === "personnel") {
      return `personnel '${personnelMap.get(id) ?? "unknown"}' (#${id})`;
    }
    return `${log.actorRole} (#${id})`;
  };

  const formatTarget = (log: { targetType: string; targetId: number | null }) => {
    if (!log.targetId) return log.targetType;

    const id = log.targetId;
    if (log.targetType === "admin") {
      return `admin '${adminMap.get(id) ?? "unknown"}' (#${id})`;
    }
    if (log.targetType === "personnel") {
      return `personnel '${personnelMap.get(id) ?? "unknown"}' (#${id})`;
    }
    if (log.targetType === "form") {
      return `form '${formMap.get(id) ?? "unknown"}' (#${id})`;
    }
    return `${log.targetType} (#${id})`;
  };

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold text-text-default">System Logs</h1>
      <div className="space-y-2">
        {logs.map((log) => (
          <article key={log.logId} className="rounded-lg border border-border-default bg-surface p-3 text-sm">
            <p className="font-medium text-text-default">{log.actionType}</p>
            <p className="text-text-muted">
              Actor: {formatActor(log)} | Target: {formatTarget(log)}
            </p>
          </article>
        ))}
        {logs.length === 0 ? <p className="text-sm text-text-muted">No audit logs yet.</p> : null}
      </div>
    </section>
  );
}

