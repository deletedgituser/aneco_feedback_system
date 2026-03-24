import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getSessionPayload } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FlashToast } from "@/components/ui/flash-toast";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ toastType?: "success" | "error"; toastMessage?: string; mode?: string }>;
}) {
  const query = await searchParams;
  const showAddForm = query.mode === "add";

  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
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
    const firstQuestion = String(formData.get("firstQuestion") ?? "").trim();

    if (!title || !firstQuestion) {
      redirect("/forms?toastType=error&toastMessage=Title+and+first+question+are+required.");
    }

    const createdForm = await prisma.form.create({
      data: {
        title,
        description: description || null,
        language,
        createdByPersonnelId: personnelId,
        questions: {
          create: {
            type: "smiley_rating",
            label: firstQuestion,
            displayOrder: 1,
          },
        },
      },
      select: { formId: true },
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
    <section>
      {query.toastType && query.toastMessage ? <FlashToast type={query.toastType} message={query.toastMessage} /> : null}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Feedback Forms</h1>
        {showAddForm ? (
          <Link
            href="/forms"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>
        ) : (
          <Link
            href="/forms?mode=add"
            className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            Add Form
          </Link>
        )}
      </div>

      {showAddForm ? (
        <section className="mb-5 rounded-lg border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Add New Form</h2>
          <form action={createFormAction} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="title"
                placeholder="Form title"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <select
                name="language"
                defaultValue="en"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              >
                <option value="en">English (en)</option>
                <option value="bis">Bisaya (bis)</option>
              </select>
            </div>

            <textarea
              name="description"
              placeholder="Form description"
              className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <input
              name="firstQuestion"
              placeholder="First smiley question"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                Create Form
              </button>
              <Link
                href="/forms"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        {forms.map(
          (form: {
            formId: number;
            title: string;
            description: string | null;
            language: string;
            isActive: boolean;
          }) => (
          <article key={form.formId} className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">{form.title}</h2>
            <p className="mt-1 flex-grow text-sm text-slate-600">{form.description ?? "No description"}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{form.language}</span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/kiosk/forms/${form.formId}?returnUrl=${encodeURIComponent("/forms")}`}
                className="rounded-md border border-cyan-300 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
              >
                Open kiosk form
              </Link>
              <Link href={`/forms/${form.formId}`} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                Edit form
              </Link>
              <form action={toggleFormStatusAction}>
                <input type="hidden" name="formId" value={form.formId} />
                <input type="hidden" name="nextStatus" value={String(!form.isActive)} />
                <button
                  type="submit"
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No forms found. Create the first rating form.
          </p>
        ) : null}
      </div>
    </section>
  );
}
