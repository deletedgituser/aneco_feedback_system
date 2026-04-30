import { prisma } from "@/lib/prisma";

type LogLookup = {
  adminMap: Map<number, string>;
  personnelMap: Map<number, string>;
  formMap: Map<number, string>;
};

function formatDateTime(value: Date): string {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function formatActor(log: { actorRole: string; actorId: number | null }, lookup: LogLookup): string {
  if (!log.actorId) {
    return log.actorRole === "kiosk" ? "Kiosk user" : log.actorRole;
  }

  if (log.actorRole === "admin") {
    return `Admin ${lookup.adminMap.get(log.actorId) ?? "unknown"} (#${log.actorId})`;
  }
  if (log.actorRole === "personnel") {
    return `Personnel ${lookup.personnelMap.get(log.actorId) ?? "unknown"} (#${log.actorId})`;
  }
  return `${log.actorRole} (#${log.actorId})`;
}

function formatTarget(log: { targetType: string; targetId: number | null }, lookup: LogLookup): string {
  if (!log.targetId) return log.targetType;

  if (log.targetType === "admin") return `admin ${lookup.adminMap.get(log.targetId) ?? "unknown"} (#${log.targetId})`;
  if (log.targetType === "personnel") return `personnel ${lookup.personnelMap.get(log.targetId) ?? "unknown"} (#${log.targetId})`;
  if (log.targetType === "form") return `form ${lookup.formMap.get(log.targetId) ?? "unknown"} (#${log.targetId})`;
  return `${log.targetType} #${log.targetId}`;
}

function titleForAction(actionType: string): string {
  const titles: Record<string, string> = {
    "auth.login.success": "Successful login",
    "auth.login.failed": "Failed login attempt",
    "feedback.submitted": "Feedback submitted",
    "form.create": "Form created",
    "form.update": "Form updated",
    "form.delete": "Form deleted",
    "form.activate": "Form activated",
    "form.deactivate": "Form deactivated",
    "question.create": "Question added",
    "question.update": "Question updated",
    "question.delete": "Question deleted",
    "question.reorder": "Questions reordered",
    "personnel.activate": "Personnel account activated",
    "personnel.deactivate": "Personnel account deactivated",
    "personnel.delete": "Personnel account deleted",
    "report.download": "Report downloaded",
    CREATE_ACCOUNT: "Personnel account created",
    UPDATE_ACCOUNT: "Personnel account updated",
    UPDATE_ACCOUNT_WITH_PASSWORD: "Personnel account and password updated",
  };

  return titles[actionType] ?? actionType.replaceAll(".", " ").replaceAll("_", " ").toLowerCase();
}

function toneForAction(actionType: string): string {
  if (actionType.includes("failed") || actionType.includes("delete")) {
    return "border-danger/25 bg-error-bg text-error-fg";
  }
  if (actionType.includes("download")) {
    return "border-primary/25 bg-primary/10 text-primary";
  }
  if (actionType.includes("create") || actionType.includes("success") || actionType === "CREATE_ACCOUNT") {
    return "border-success/25 bg-success-bg text-success-fg";
  }
  return "border-border bg-surface-soft text-text-default";
}

function describeLog(
  log: { actionType: string; actorRole: string; actorId: number | null; targetType: string; targetId: number | null; metadataJson: unknown },
  lookup: LogLookup,
): string {
  const actor = formatActor(log, lookup);
  const target = formatTarget(log, lookup);
  const metadata = metadataObject(log.metadataJson);

  switch (log.actionType) {
    case "auth.login.success":
      return `${actor} signed in successfully.`;
    case "auth.login.failed":
      return `A sign-in attempt failed${typeof metadata.username === "string" ? ` for "${metadata.username}"` : ""}.`;
    case "feedback.submitted":
      return `A kiosk respondent submitted feedback for ${target}.`;
    case "form.create":
      return `${actor} created ${target}.`;
    case "form.update":
      return `${actor} updated ${target}.`;
    case "form.delete":
      return `${actor} deleted ${target}.`;
    case "form.activate":
      return `${actor} activated ${target}.`;
    case "form.deactivate":
      return `${actor} deactivated ${target}.`;
    case "question.create":
      return `${actor} added a question to the feedback form.`;
    case "question.update":
      return `${actor} updated a survey question.`;
    case "question.delete":
      return `${actor} deleted a survey question.`;
    case "question.reorder":
      return `${actor} reordered survey questions.`;
    case "report.download":
      return `${actor} downloaded a ${String(metadata.format ?? "report")} report for ${target}.`;
    case "personnel.activate":
      return `${actor} activated ${target}.`;
    case "personnel.deactivate":
      return `${actor} deactivated ${target}.`;
    case "personnel.delete":
      return `${actor} deleted ${target}.`;
    case "CREATE_ACCOUNT":
      return `${actor} created ${target}.`;
    case "UPDATE_ACCOUNT":
    case "UPDATE_ACCOUNT_WITH_PASSWORD":
      return `${actor} updated ${target}.`;
    default:
      return `${actor} performed "${log.actionType}" on ${target}.`;
  }
}

function detailRows(metadata: unknown): string[] {
  const data = metadataObject(metadata);
  const rows: string[] = [];

  if (typeof data.downloadedBy === "string") rows.push(`Downloaded by: ${data.downloadedBy}`);
  if (typeof data.formTitle === "string") rows.push(`Form: ${data.formTitle}`);
  if (Array.isArray(data.filters)) rows.push(`Filters: ${data.filters.join("; ")}`);
  if (typeof data.format === "string") rows.push(`Format: ${data.format.toUpperCase()}`);
  if (typeof data.feedbackCount === "number") rows.push(`Submissions removed: ${data.feedbackCount}`);
  if (typeof data.responseCount === "number") rows.push(`Response items removed: ${data.responseCount}`);

  return rows;
}

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
        .concat(logs.filter((log) => log.targetType === "admin" && log.targetId).map((log) => log.targetId as number)),
    ),
  );
  const personnelIds = Array.from(
    new Set(
      logs
        .filter((log) => log.actorRole === "personnel" && log.actorId)
        .map((log) => log.actorId as number)
        .concat(logs.filter((log) => log.targetType === "personnel" && log.targetId).map((log) => log.targetId as number)),
    ),
  );
  const formIds = Array.from(new Set(logs.filter((log) => log.targetType === "form" && log.targetId).map((log) => log.targetId as number)));

  const [admins, personnel, forms] = await Promise.all([
    adminIds.length > 0 ? prisma.admin.findMany({ where: { adminId: { in: adminIds } } }) : [],
    personnelIds.length > 0 ? prisma.personnel.findMany({ where: { personnelId: { in: personnelIds } } }) : [],
    formIds.length > 0 ? prisma.form.findMany({ where: { formId: { in: formIds } } }) : [],
  ]);

  const lookup: LogLookup = {
    adminMap: new Map(admins.map((user) => [user.adminId, user.username])),
    personnelMap: new Map(personnel.map((user) => [user.personnelId, user.name])),
    formMap: new Map(forms.map((form) => [form.formId, form.title])),
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-text-default">System Logs</h1>
        <p className="mt-1 text-sm text-text-muted">Recent activity shown as readable audit events.</p>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const details = detailRows(log.metadataJson);

          return (
            <article key={log.logId} className="rounded-2xl border border-border bg-surface-soft p-4 text-sm shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneForAction(log.actionType)}`}>
                    {titleForAction(log.actionType)}
                  </span>
                  <p className="mt-3 font-medium text-text-default">{describeLog(log, lookup)}</p>
                  <p className="mt-1 text-xs text-text-muted">Audit code: {log.actionType}</p>
                </div>
                <time className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-muted ring-1 ring-border">
                  {formatDateTime(log.occurredAt)}
                </time>
              </div>

              {details.length > 0 ? (
                <div className="mt-3 grid gap-2 border-t border-border pt-3 text-xs text-text-muted sm:grid-cols-2">
                  {details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}

        {logs.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">No audit logs yet.</p> : null}
      </div>
    </section>
  );
}
