import { prisma } from "@/lib/prisma";

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">System Logs</h1>
      <div className="space-y-2">
        {logs.map((log: { logId: number; actionType: string; actorRole: string; actorId: number | null; targetType: string; targetId: number | null }) => (
          <article key={log.logId} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium text-slate-800">{log.actionType}</p>
            <p className="text-slate-600">
              Actor: {log.actorRole} {log.actorId ? `#${log.actorId}` : ""} | Target: {log.targetType}
              {log.targetId ? ` #${log.targetId}` : ""}
            </p>
          </article>
        ))}
        {logs.length === 0 ? <p className="text-sm text-slate-500">No audit logs yet.</p> : null}
      </div>
    </section>
  );
}
