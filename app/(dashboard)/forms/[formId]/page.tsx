import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { FlashToast } from "@/components/ui/flash-toast";

type PageProps = {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ toastType?: "success" | "error"; toastMessage?: string }>;
};

export default async function FormDetailPage({ params, searchParams }: PageProps) {
  const { formId } = await params;
  const query = await searchParams;
  const parsedId = Number(formId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound();
  }

  const form = await prisma.form.findUnique({
    where: { formId: parsedId },
    include: {
      questions: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!form) {
    notFound();
  }

  async function updateFormDetailsAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.personnelId) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { isActive: true },
    });

    if (!personnel || !personnel.isActive) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Your+account+is+inactive.+Please+contact+an+admin.`);
    }

    const personnelId = session.personnelId;

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const languageInput = String(formData.get("language") ?? "en").trim().toLowerCase();
    const language = languageInput === "bis" ? "bis" : "en";

    if (!title) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Title+is+required.`);
    }

    await prisma.form.update({
      where: { formId: parsedId },
      data: {
        title,
        description: description || null,
        language,
      },
    });

    await logAuditEvent({
      actorRole: "personnel",
      actorId: personnelId,
      actionType: "form.update",
      targetType: "form",
      targetId: parsedId,
    });

    revalidatePath(`/forms/${parsedId}`);
    revalidatePath("/forms");
    revalidatePath("/kiosk");
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect(`/forms/${parsedId}?toastType=success&toastMessage=Form+details+updated.`);
  }

  async function addQuestionAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.personnelId) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { isActive: true },
    });

    if (!personnel || !personnel.isActive) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Your+account+is+inactive.+Please+contact+an+admin.`);
    }

    const personnelId = session.personnelId;

    const label = String(formData.get("label") ?? "").trim();
    if (!label) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Question+text+is+required.`);
    }

    const currentMaxOrder = await prisma.question.aggregate({
      where: { formId: parsedId },
      _max: { displayOrder: true },
    });

    const displayOrder = (currentMaxOrder._max.displayOrder ?? 0) + 1;

    const question = await prisma.question.create({
      data: {
        formId: parsedId,
        type: "smiley_rating",
        label,
        displayOrder,
      },
      select: { questionId: true },
    });

    await logAuditEvent({
      actorRole: "personnel",
      actorId: personnelId,
      actionType: "question.create",
      targetType: "question",
      targetId: question.questionId,
      metadata: {
        formId: parsedId,
      },
    });

    revalidatePath(`/forms/${parsedId}`);
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect(`/forms/${parsedId}?toastType=success&toastMessage=Question+added.`);
  }

  async function deleteQuestionAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.personnelId) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { isActive: true },
    });

    if (!personnel || !personnel.isActive) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Your+account+is+inactive.+Please+contact+an+admin.`);
    }

    const personnelId = session.personnelId;

    const questionId = Number(formData.get("questionId"));
    if (!Number.isInteger(questionId) || questionId <= 0) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=Invalid+question.`);
    }

    const questionCount = await prisma.question.count({
      where: { formId: parsedId },
    });

    if (questionCount <= 1) {
      redirect(`/forms/${parsedId}?toastType=error&toastMessage=At+least+one+question+is+required+per+form.`);
    }

    await prisma.question.delete({
      where: { questionId },
    });

    await logAuditEvent({
      actorRole: "personnel",
      actorId: personnelId,
      actionType: "question.delete",
      targetType: "question",
      targetId: questionId,
      metadata: {
        formId: parsedId,
      },
    });

    revalidatePath(`/forms/${parsedId}`);
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect(`/forms/${parsedId}?toastType=success&toastMessage=Question+deleted.`);
  }

  return (
    <section className="space-y-6">
      {query.toastType && query.toastMessage ? <FlashToast type={query.toastType} message={query.toastMessage} /> : null}

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Form Management</p>
            <h1 className="text-2xl font-bold text-slate-900">{form.title}</h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {form.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{form.description ?? "No description provided."}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Form Details</h2>
          <form action={updateFormDetailsAction} className="space-y-3">
            <div>
              <label htmlFor="title" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Title
              </label>
              <input
                id="title"
                name="title"
                defaultValue={form.title}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="language" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Language
              </label>
              <select
                id="language"
                name="language"
                defaultValue={form.language === "bis" ? "bis" : "en"}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              >
                <option value="en">English (en)</option>
                <option value="bis">Bisaya (bis)</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={form.description ?? ""}
                className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Save Changes
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Questions</h2>

          <form action={addQuestionAction} className="mb-4 flex gap-2">
            <input
              name="label"
              placeholder="Add new smiley question"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              Add
            </button>
          </form>

          <div className="space-y-2">
            {form.questions.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No questions yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {form.questions.map((question) => (
                  <li key={question.questionId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-800">
                        {question.displayOrder}. {question.label}
                      </p>
                      <form action={deleteQuestionAction}>
                        <input type="hidden" name="questionId" value={question.questionId} />
                        <button
                          type="submit"
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
