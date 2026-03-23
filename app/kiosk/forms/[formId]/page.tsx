import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

type KioskQuestion = {
  questionId: number;
  label: string;
};

const ratingOptions = [
  { score: 1, emoji: "😠", label: "Very unsatisfied" },
  { score: 2, emoji: "🙁", label: "Unsatisfied" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "🙂", label: "Satisfied" },
  { score: 5, emoji: "😄", label: "Very satisfied" },
];

export default async function KioskFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ userName?: string; assistedEmployee?: string }>;
}) {
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

  if (!form || !form.isActive) {
    notFound();
  }

  const activeForm = form;
  const isBisaya = activeForm.language.toLowerCase() === "bis";
  const text = {
    ratingGuideTitle: isBisaya ? "Giya sa rating" : "Rating guide",
    ratingGuideBody: isBisaya
      ? "Ang 1 (😠 Angry) nagpasabot dili kontento ug ang 5 (😄 Smile) nagpasabot kontento."
      : "1 (😠 Angry) means unsatisfied and 5 (😄 Smile) means satisfied.",
    optionalDetails: isBisaya ? "Opsyonal nga Detalye" : "Optional Details",
    yourName: isBisaya ? "Imong ngalan (opsyonal)" : "Your name (optional)",
    assistedEmployee: isBisaya ? "Gi-assist nga empleyado (opsyonal)" : "Employee assisted (optional)",
    questionLabel: isBisaya ? "Pangutana" : "Question",
    of: isBisaya ? "sa" : "of",
    submit: isBisaya ? "I-submit ang feedback" : "Submit feedback",
  };

  async function submitFeedback(formData: FormData) {
    "use server";

    const userName = String(formData.get("userName") ?? "").trim() || null;
    const assistedEmployee = String(formData.get("assistedEmployee") ?? "").trim() || null;

    const feedback = await prisma.feedback.create({
      data: {
        formId: activeForm.formId,
        userName,
        assistedEmployee,
      },
    });

    const responseRows = activeForm.questions.map((question: KioskQuestion) => {
      const value = Number(formData.get(`q-${question.questionId}`));
      const answerValue = Number.isInteger(value) && value >= 1 && value <= 5 ? value : 3;
      return {
        feedbackId: feedback.feedbackId,
        questionId: question.questionId,
        answerValue,
      };
    });

    if (responseRows.length > 0) {
      await prisma.response.createMany({
        data: responseRows,
      });
    }

    await logAuditEvent({
      actorRole: "kiosk",
      actionType: "feedback.submitted",
      targetType: "form",
      targetId: activeForm.formId,
      metadata: {
        feedbackId: feedback.feedbackId,
      },
    });

    const params = new URLSearchParams();
    if (userName) {
      params.set("userName", userName);
    }
    if (assistedEmployee) {
      params.set("assistedEmployee", assistedEmployee);
    }

    params.set("formId", String(activeForm.formId));
    params.set("lang", isBisaya ? "bis" : "en");

    redirect(`/kiosk/thank-you?${params.toString()}`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:px-5 sm:py-7">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{activeForm.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{activeForm.description}</p>
        <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-950">
          <p className="font-semibold">{text.ratingGuideTitle}</p>
          <p className="mt-0.5">{text.ratingGuideBody}</p>
        </div>
      </header>

      <form action={submitFeedback} className="mt-4 space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{text.optionalDetails}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">{text.yourName}</span>
              <input
                name="userName"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                defaultValue={query.userName ?? ""}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">{text.assistedEmployee}</span>
              <input
                name="assistedEmployee"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                defaultValue={query.assistedEmployee ?? ""}
              />
            </label>
          </div>
        </section>

        {activeForm.questions.map((question: KioskQuestion, index: number) => (
          <section key={question.questionId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              {text.questionLabel} {index + 1} {text.of} {activeForm.questions.length}
            </p>
            <p className="mt-1.5 text-lg font-semibold leading-snug text-slate-900">{question.label}</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {ratingOptions.map((option) => (
                <label
                  key={option.score}
                  className="inline-flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm transition hover:border-cyan-300 hover:bg-cyan-50 sm:min-h-20"
                  title={option.label}
                >
                  <input
                    type="radio"
                    name={`q-${question.questionId}`}
                    value={option.score}
                    defaultChecked={option.score === 3}
                    aria-label={`${option.score} - ${option.label}`}
                    className="h-4 w-4 accent-cyan-600"
                  />
                  <span className="text-xl leading-none" aria-hidden="true">
                    {option.emoji}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{option.score}</span>
                </label>
              ))}
            </div>
          </section>
        ))}

        <div>
          <button
            type="submit"
            className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
          >
            {text.submit}
          </button>
        </div>
      </form>
    </main>
  );
}
