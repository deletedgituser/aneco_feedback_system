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
    <section className="space-y-5">
      {query.toastType && query.toastMessage ? <FlashToast type={query.toastType} message={query.toastMessage} /> : null}

      <h1 className="text-xl font-semibold text-slate-900">Edit Form</h1>

      <form action={updateFormDetailsAction} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
        <input
          name="title"
          defaultValue={form.title}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />
        <select
          name="language"
          defaultValue={form.language === "bis" ? "bis" : "en"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        >
          <option value="en">English (en)</option>
          <option value="bis">Bisaya (bis)</option>
        </select>
        <textarea
          name="description"
          defaultValue={form.description ?? ""}
          className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2"
        >
          Save Form Details
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Questions</h2>

        <form action={addQuestionAction} className="mb-4 flex gap-2">
          <input
            name="label"
            placeholder="Add new smiley question"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            Add
          </button>
        </form>

        <ul className="space-y-2">
          {form.questions.map((question) => (
            <li key={question.questionId} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <p className="text-sm text-slate-700">
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
