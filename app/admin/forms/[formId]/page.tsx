import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { FlashToast } from "@/components/ui/flash-toast";
import { FormDetailQuestionsClient } from "@/components/dashboard/form-detail-client";

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

type PageProps = {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ toastType?: "success" | "error"; toastMessage?: string }>;
};

export default async function AdminFormDetailPage({ params, searchParams }: PageProps) {
  const { formId } = await params;
  const query = await searchParams;
  const parsedId = Number(formId);

  const session = await getSessionPayload();
  if (!session?.adminId) {
    redirect("/login?toastType=error&toastMessage=Unauthorized+access.");
  }

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
    if (!session?.adminId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const adminId = session.adminId;

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const languageInput = String(formData.get("language") ?? "en").trim().toLowerCase();
    const language = languageInput === "bis" ? "bis" : "en";

    if (!title) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Title+is+required.`);
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
      actorRole: "admin",
      actorId: adminId,
      actionType: "form.update",
      targetType: "form",
      targetId: parsedId,
    });

    revalidatePath(`/admin/forms/${parsedId}`);
    revalidatePath("/admin/forms");
    revalidatePath("/kiosk");
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect("/admin/forms?toastType=success&toastMessage=Form+details+updated.");
  }

  async function addQuestionAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const adminId = session.adminId;

    const label = String(formData.get("label") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const categoryPart = String(formData.get("categoryPart") ?? "").trim();

    if (!label) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Question+text+is+required.`);
    }

    if (label.length > 191) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Question+text+must+be+191+characters+or+fewer.`);
    }

    if (categoryPart.length > 120) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Category+must+be+120+characters+or+fewer.`);
    }

    const question = await prisma.$transaction(async (tx) => {
      const overallQuestion = await tx.question.findFirst({
        where: {
          formId: parsedId,
          isOverallSatisfaction: true,
        },
        orderBy: { displayOrder: "asc" },
        select: { questionId: true, displayOrder: true },
      });

      const currentMaxOrder = await tx.question.aggregate({
        where: { formId: parsedId },
        _max: { displayOrder: true },
      });

      const insertionOrder = overallQuestion?.displayOrder ?? (currentMaxOrder._max.displayOrder ?? 0) + 1;

      if (overallQuestion) {
        await tx.question.updateMany({
          where: {
            formId: parsedId,
            displayOrder: { gte: insertionOrder },
          },
          data: {
            displayOrder: { increment: 1 },
          },
        });
      }

      const createdQuestion = await tx.question.create({
        data: {
          formId: parsedId,
          type: "smiley_rating",
          label,
          description: description || null,
          categoryPart: categoryPart || null,
          displayOrder: insertionOrder,
        },
        select: { questionId: true },
      });

      if (!overallQuestion) {
        const selectedForm = await tx.form.findUnique({
          where: { formId: parsedId },
          select: { language: true },
        });

        if (selectedForm) {
          const overallContent = getOverallQuestionContent(selectedForm.language === "bis" ? "bis" : "en");
          await tx.question.create({
            data: {
              formId: parsedId,
              type: "smiley_rating",
              label: overallContent.label,
              description: overallContent.description,
              categoryPart: "Overall",
              isOverallSatisfaction: true,
              displayOrder: insertionOrder + 1,
            },
          });
        }
      }

      return createdQuestion;
    });

    await logAuditEvent({
      actorRole: "admin",
      actorId: adminId,
      actionType: "question.create",
      targetType: "question",
      targetId: question.questionId,
      metadata: {
        formId: parsedId,
      },
    });

    revalidatePath(`/admin/forms/${parsedId}`);
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect(`/admin/forms/${parsedId}?toastType=success&toastMessage=Question+added.`);
  }

  async function updateQuestionAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const adminId = session.adminId;
    const questionId = Number(formData.get("questionId"));
    const label = String(formData.get("label") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const categoryPart = String(formData.get("categoryPart") ?? "").trim();

    if (!Number.isInteger(questionId) || questionId <= 0) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Invalid+question.`);
    }

    if (!label) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Question+text+is+required.`);
    }

    if (label.length > 191) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Question+text+must+be+191+characters+or+fewer.`);
    }

    if (categoryPart.length > 120) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Category+must+be+120+characters+or+fewer.`);
    }

    const question = await prisma.question.findUnique({
      where: { questionId },
      select: { formId: true },
    });

    if (!question || question.formId !== parsedId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Invalid+question.`);
    }

    try {
      await prisma.question.update({
        where: { questionId },
        data: {
          label,
          description: description || null,
          categoryPart: categoryPart || null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Unable+to+update+question+with+provided+values.`);
      }
      throw error;
    }

    await logAuditEvent({
      actorRole: "admin",
      actorId: adminId,
      actionType: "question.update",
      targetType: "question",
      targetId: questionId,
      metadata: {
        formId: parsedId,
      },
    });

    revalidatePath(`/admin/forms/${parsedId}`);
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect(`/admin/forms/${parsedId}?toastType=success&toastMessage=Question+updated.`);
  }

  async function deleteQuestionAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const adminId = session.adminId;

    const questionId = Number(formData.get("questionId"));
    if (!Number.isInteger(questionId) || questionId <= 0) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Invalid+question.`);
    }

    const question = await prisma.question.findUnique({
      where: { questionId },
      select: { formId: true, isOverallSatisfaction: true },
    });

    if (!question || question.formId !== parsedId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Invalid+question.`);
    }

    if (question.isOverallSatisfaction) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Overall+Satisfaction+question+cannot+be+deleted.`);
    }

    const questionCount = await prisma.question.count({
      where: { formId: parsedId },
    });

    if (questionCount <= 1) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=At+least+one+question+is+required+per+form.`);
    }

    await prisma.question.delete({
      where: { questionId },
    });

    await logAuditEvent({
      actorRole: "admin",
      actorId: adminId,
      actionType: "question.delete",
      targetType: "question",
      targetId: questionId,
      metadata: {
        formId: parsedId,
      },
    });

    revalidatePath(`/admin/forms/${parsedId}`);
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect(`/admin/forms/${parsedId}?toastType=success&toastMessage=Question+deleted.`);
  }

  async function moveQuestionAction(formData: FormData) {
    "use server";

    const session = await getSessionPayload();
    if (!session?.adminId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Unauthorized+action.`);
    }

    const questionId = Number(formData.get("questionId"));
    const direction = String(formData.get("direction")).trim();

    if (!Number.isInteger(questionId) || questionId <= 0 || !["up", "down"].includes(direction)) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Invalid+request.`);
    }

    const question = await prisma.question.findUnique({
      where: { questionId },
      select: { formId: true, displayOrder: true, isOverallSatisfaction: true },
    });

    if (!question || question.formId !== parsedId) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Invalid+question.`);
    }

    if (question.isOverallSatisfaction) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Overall+Satisfaction+question+cannot+be+reordered.`);
    }

    const allQuestions = await prisma.question.findMany({
      where: { formId: parsedId },
      orderBy: { displayOrder: "asc" },
      select: { questionId: true, displayOrder: true, isOverallSatisfaction: true },
    });

    // Find the second question while excluding overall satisfaction
    const nonOverallQuestions = allQuestions.filter((q) => !q.isOverallSatisfaction);
    const currentIndex = nonOverallQuestions.findIndex((q) => q.questionId === questionId);

    if (direction === "up" && currentIndex === 0) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Cannot+move+question+up+further.`);
    }

    if (direction === "down" && currentIndex === nonOverallQuestions.length - 1) {
      redirect(`/admin/forms/${parsedId}?toastType=error&toastMessage=Cannot+move+question+down+further.`);
    }

    const swapWithQuestion =
      direction === "up"
        ? nonOverallQuestions[currentIndex - 1]
        : nonOverallQuestions[currentIndex + 1];

    await prisma.$transaction([
      prisma.question.update({
        where: { questionId },
        data: { displayOrder: swapWithQuestion.displayOrder },
      }),
      prisma.question.update({
        where: { questionId: swapWithQuestion.questionId },
        data: { displayOrder: question.displayOrder },
      }),
    ]);

    await logAuditEvent({
      actorRole: "admin",
      actorId: session.adminId,
      actionType: "question.reorder",
      targetType: "question",
      targetId: questionId,
      metadata: {
        formId: parsedId,
        direction,
      },
    });

    revalidatePath(`/admin/forms/${parsedId}`);
    revalidatePath(`/kiosk/forms/${parsedId}`);
    redirect(`/admin/forms/${parsedId}?toastType=success&toastMessage=Question+reordered.`);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/forms"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default transition-colors duration-150 hover:bg-surface-soft"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
      </div>
      {query.toastType && query.toastMessage ? <FlashToast type={query.toastType} message={query.toastMessage} /> : null}

      <header className="rounded-2xl border border-border bg-surface p-6 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">Form Management</p>
            <h1 className="text-2xl font-bold text-text-default">{form.title}</h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              form.isActive ? "bg-success/20 text-success" : "bg-danger/18 text-danger"
            }`}
          >
            {form.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="mt-2 text-sm text-text-muted">{form.description ?? "No description provided."}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-default">Form Details</h2>
          <form action={updateFormDetailsAction} className="space-y-3">
            <div>
              <label htmlFor="title" className="mb-1 block text-xs font-semibold uppercase text-text-muted">
                Title
              </label>
              <input
                id="title"
                name="title"
                defaultValue={form.title}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="language" className="mb-1 block text-xs font-semibold uppercase text-text-muted">
                Language
              </label>
              <select
                id="language"
                name="language"
                defaultValue={form.language === "bis" ? "bis" : "en"}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                required
              >
                <option value="en">English (en)</option>
                <option value="bis">Bisaya (bis)</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-xs font-semibold uppercase text-text-muted">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={form.description ?? ""}
                className="h-24 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Save Changes
              </button>
              <Link
                href="/admin/forms"
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-default hover:bg-surface-soft"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-default">Questions</h2>

          <form action={addQuestionAction} className="mb-4 space-y-3">
            <input
              name="label"
              placeholder="Question text"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
              required
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="categoryPart"
                placeholder="Category/Part (optional)"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
              />
              <input
                name="description"
                placeholder="Short description (optional)"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Add
            </button>
          </form>

          <FormDetailQuestionsClient
            questions={form.questions}
            toastMessage={query.toastMessage}
            toastType={query.toastType}
            updateQuestionAction={updateQuestionAction}
            deleteQuestionAction={deleteQuestionAction}
            moveQuestionAction={moveQuestionAction}
          />
        </div>
      </div>
    </section>
  );
}
