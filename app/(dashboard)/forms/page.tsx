import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getSessionPayload } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FlashToast } from "@/components/ui/flash-toast";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

function getOverallQuestionContent(language: "en" | "bis") {
  if (language === "bis") {
    return {
      label: "Kinatibuk-ang Katagbawan",
      description: "Palihug i-rate ang imong kinatibuk-ang kasinatian.",
    };
  }

  return {
    label: "Overall Satisfaction",
    description: "Please rate your overall experience.",
  };
}

type StatusFilter = "all" | "active" | "inactive";

function parseStatusFilter(value: string | undefined): StatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }
  return "all";
}

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ toastType?: "success" | "error"; toastMessage?: string; mode?: string; status?: string }>;
}) {
  const query = await searchParams;
  const showAddForm = query.mode === "add";
  const statusFilter = parseStatusFilter(query.status);

  function buildFormsHref(nextStatus: StatusFilter, mode?: "add"): string {
    const params = new URLSearchParams();
    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }
    if (mode === "add") {
      params.set("mode", "add");
    }
    return `/forms${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const forms = await prisma.form.findMany({
    where: statusFilter === "all" ? undefined : { isActive: statusFilter === "active" },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  async function createFormAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.personnelId) {
      redirect("/forms?toastType=error&toastMessage=Unauthorized+action.");
    }

    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { isActive: true },
    });

    if (!personnel || !personnel.isActive) {
      redirect("/forms?toastType=error&toastMessage=Your+account+is+inactive.+Please+contact+an+admin.");
    }

    const personnelId = session.personnelId;

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const languageInput = String(formData.get("language") ?? "en").trim().toLowerCase();
    const language = languageInput === "bis" ? "bis" : "en";
    const starterQuestionsRaw = String(formData.get("starterQuestions") ?? "").trim();

    const starterQuestions = starterQuestionsRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 20);

    if (!title) {
      redirect("/forms?toastType=error&toastMessage=Title+is+required.");
    }

    const overallQuestion = getOverallQuestionContent(language);

    const createdForm = await prisma.$transaction(async (tx) => {
      const formRow = await tx.form.create({
        data: {
          title,
          description: description || null,
          language,
          createdByPersonnelId: personnelId,
        },
        select: { formId: true },
      });

      if (starterQuestions.length > 0) {
        await tx.question.createMany({
          data: starterQuestions.map((label, index) => ({
            formId: formRow.formId,
            type: "smiley_rating",
            label,
            displayOrder: index + 1,
          })),
        });
      }

      await tx.question.create({
        data: {
          formId: formRow.formId,
          type: "smiley_rating",
          label: overallQuestion.label,
          description: overallQuestion.description,
          categoryPart: "Overall",
          isOverallSatisfaction: true,
          displayOrder: starterQuestions.length + 1,
        },
      });

      return formRow;
    });

    await logAuditEvent({
      actorRole: "personnel",
      actorId: personnelId,
      actionType: "form.create",
      targetType: "form",
      targetId: createdForm.formId,
    });

    revalidatePath("/forms");
    revalidatePath("/dashboard");
    revalidatePath("/kiosk");
    redirect(`/forms/${createdForm.formId}?toastType=success&toastMessage=Form+created+successfully.`);
  }

  async function toggleFormStatusAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.personnelId) {
      redirect("/forms?toastType=error&toastMessage=Unauthorized+action.");
    }

    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { isActive: true },
    });

    if (!personnel || !personnel.isActive) {
      redirect("/forms?toastType=error&toastMessage=Your+account+is+inactive.+Please+contact+an+admin.");
    }

    const personnelId = session.personnelId;

    const formId = Number(formData.get("formId"));
    const nextStatus = String(formData.get("nextStatus")) === "true";

    if (!Number.isInteger(formId) || formId <= 0) {
      redirect("/forms?toastType=error&toastMessage=Invalid+form.");
    }

    await prisma.form.update({
      where: { formId },
      data: { isActive: nextStatus },
    });

    await logAuditEvent({
      actorRole: "personnel",
      actorId: personnelId,
      actionType: nextStatus ? "form.activate" : "form.deactivate",
      targetType: "form",
      targetId: formId,
    });

    revalidatePath("/forms");
    revalidatePath("/kiosk");
    redirect(
      nextStatus
        ? "/forms?toastType=success&toastMessage=Form+activated."
        : "/forms?toastType=success&toastMessage=Form+deactivated.",
    );
  }

  async function deleteFormAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.personnelId) {
      redirect("/forms?toastType=error&toastMessage=Unauthorized+action.");
    }

    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { isActive: true },
    });

    if (!personnel || !personnel.isActive) {
      redirect("/forms?toastType=error&toastMessage=Your+account+is+inactive.+Please+contact+an+admin.");
    }

    const personnelId = session.personnelId;

    const formId = Number(formData.get("formId"));
    if (!Number.isInteger(formId) || formId <= 0) {
      redirect("/forms?toastType=error&toastMessage=Invalid+form.");
    }

    const feedbackCount = await prisma.feedback.count({
      where: { formId },
    });

    if (feedbackCount > 0) {
      redirect("/forms?toastType=error&toastMessage=Form+cannot+be+deleted+because+it+already+has+submissions.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { formId } });
      await tx.form.delete({ where: { formId } });
    });

    await logAuditEvent({
      actorRole: "personnel",
      actorId: personnelId,
      actionType: "form.delete",
      targetType: "form",
      targetId: formId,
    });

    revalidatePath("/forms");
    revalidatePath("/dashboard");
    revalidatePath("/kiosk");
    redirect("/forms?toastType=success&toastMessage=Form+deleted+successfully.");
  }

  return (
    <section className="space-y-6">
      {query.toastType && query.toastMessage ? <FlashToast type={query.toastType} message={query.toastMessage} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-default">Feedback Forms</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildFormsHref("all")}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              statusFilter === "all"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-default hover:bg-surface-soft"
            }`}
          >
            All
          </Link>
          <Link
            href={buildFormsHref("active")}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              statusFilter === "active"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-default hover:bg-surface-soft"
            }`}
          >
            Active
          </Link>
          <Link
            href={buildFormsHref("inactive")}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              statusFilter === "inactive"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-default hover:bg-surface-soft"
            }`}
          >
            Inactive
          </Link>
          {showAddForm ? (
            <Link
              href={buildFormsHref(statusFilter)}
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text-default hover:bg-surface-soft"
            >
              Cancel
            </Link>
          ) : (
            <Link
              href={buildFormsHref(statusFilter, "add")}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Add Form
            </Link>
          )}
        </div>
      </div>

      {showAddForm ? (
        <section className="rounded-2xl border border-border bg-surface-soft p-6 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
          <h2 className="mb-3 text-lg font-semibold text-text-default">Add New Form</h2>
          <form action={createFormAction} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="title"
                placeholder="Form title"
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                required
              />
              <select
                name="language"
                defaultValue="en"
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                required
              >
                <option value="en">English (en)</option>
                <option value="bis">Bisaya (bis)</option>
              </select>
            </div>

            <textarea
              name="description"
              placeholder="Form description"
              className="h-24 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
            />

            <div>
              <label htmlFor="starterQuestions" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Starter questions (optional)
              </label>
              <textarea
                id="starterQuestions"
                name="starterQuestions"
                placeholder="One question per line"
                className="h-28 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
              />
              <p className="mt-1 text-xs text-text-muted">The form will always include a final Overall Satisfaction question automatically.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Create Form
              </button>
              <Link
                href="/forms"
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-default hover:bg-surface"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {forms.map(
          (form: {
            formId: number;
            title: string;
            description: string | null;
            language: string;
            isActive: boolean;
          }) => (
            <article
              key={form.formId}
              className={`flex h-full flex-col rounded-2xl border border-border p-5 ${
                form.isActive ? "bg-surface" : "bg-surface-muted"
              }`}
            >
              <h2 className="font-semibold text-text-default">{form.title}</h2>
              <p className="mt-1 flex-grow text-sm text-text-muted">{form.description ?? "No description"}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-text-muted">{form.language}</span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  form.isActive ? "bg-success/20 text-success" : "bg-danger/18 text-danger"
                }`}
              >
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/kiosk/forms/${form.formId}?returnUrl=${encodeURIComponent("/forms")}`}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-soft"
              >
                Open kiosk form
              </Link>
              <Link href={`/forms/${form.formId}`} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default hover:bg-surface-soft">
                Edit form
              </Link>
              <form action={toggleFormStatusAction}>
                <input type="hidden" name="formId" value={form.formId} />
                <input type="hidden" name="nextStatus" value={String(!form.isActive)} />
                <button
                  type="submit"
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default hover:bg-surface-soft"
                >
                  {form.isActive ? "Deactivate" : "Activate"}
                </button>
              </form>
              <form action={deleteFormAction}>
                <input type="hidden" name="formId" value={form.formId} />
                <ConfirmDeleteButton formId={form.formId}>Delete</ConfirmDeleteButton>
              </form>
            </div>
          </article>
        ),
        )}
        {forms.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
            No forms found. Create the first rating form.
          </p>
        ) : null}
      </div>
    </section>
  );
}
