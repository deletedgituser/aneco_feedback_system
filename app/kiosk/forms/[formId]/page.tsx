import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { KioskQuestionForm } from "@/components/kiosk/kiosk-question-form";

export default async function KioskFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ userName?: string; assistedEmployee?: string; returnUrl?: string }>;
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

  const activeForm = {
    formId: form.formId,
    title: form.title,
    description: form.description,
    language: form.language,
    questions: form.questions.map((question) => ({
      questionId: question.questionId,
      label: question.label,
      description: question.description,
      categoryPart: question.categoryPart,
      isOverallSatisfaction: question.isOverallSatisfaction,
    })),
  };
  const returnUrl = query.returnUrl ? String(query.returnUrl) : "/kiosk";
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
    commentsLabel: isBisaya ? "Komento o sugyot (opsyonal)" : "Comments or suggestions (optional)",
    commentsPlaceholder: isBisaya
      ? "Isulat dinhi ang imong komento o sugyot..."
      : "Write your comments or suggestions here...",
    submit: isBisaya ? "I-submit ang feedback" : "Submit feedback",
    submitting: isBisaya ? "Nagasubmit..." : "Submitting...",
    completion: isBisaya ? "Progress sa mga pangutana" : "Question progress",
    overallSection: isBisaya ? "Kinatibuk-ang Kuntento" : "Overall satisfaction",
    cancel: isBisaya ? "Balik" : "Cancel",
  };

  async function submitFeedback(formData: FormData) {
    "use server";

    const userName = String(formData.get("userName") ?? "").trim() || null;
    const assistedEmployee = String(formData.get("assistedEmployee") ?? "").trim() || null;
    const comments = String(formData.get("comments") ?? "").trim() || null;

    const answers: { questionId: number; answerValue: number }[] = [];
    for (const question of activeForm.questions) {
      const rawValue = formData.get(`q-${question.questionId}`);
      if (rawValue !== null && rawValue !== "") {
        // Question was answered - validate and include
        const value = Number(rawValue);
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          redirect(`/kiosk/forms/${activeForm.formId}?toastType=error&toastMessage=Invalid+rating+value.`);
        }
        answers.push({ questionId: question.questionId, answerValue: value });
      }
      // If not answered, we simply don't include it in the answers array
    }

    const feedback = await prisma.feedback.create({
      data: {
        formId: activeForm.formId,
        userName,
        assistedEmployee,
        comments,
      },
    });

    const responseRows = answers.map((answer) => ({
      feedbackId: feedback.feedbackId,
      questionId: answer.questionId,
      answerValue: answer.answerValue,
    }));

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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="motion-fade-up relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -left-20 -top-16 h-44 w-44 rounded-full bg-primary/8 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 -bottom-16 h-44 w-44 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />

        <div className="relative mb-3 flex items-center justify-between gap-3">
          <Link
            href={returnUrl}
            className="inline-flex rounded-xl border border-border px-2.5 py-1.5 text-xs font-semibold text-text-default transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            Back
          </Link>

          <Image
            src="/logo.png"
            alt="ANECO logo"
            width={52}
            height={52}
            className="h-12 w-12 rounded-xl bg-surface-soft p-1 object-contain"
            priority
          />
        </div>

        <div className="relative mb-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-text-default sm:text-3xl">{activeForm.title}</h1>
          <span className="hidden rounded-full bg-accent/24 px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-default ring-1 ring-accent/30 sm:inline-flex">
            {activeForm.language.toUpperCase()}
          </span>
        </div>

        <p className="relative mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">{activeForm.description}</p>
        <div className="relative mt-5 rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm text-text-default">
          <p className="font-bold uppercase">{text.ratingGuideTitle}</p>
          <p className="mt-1 text-sm sm:text-base">{text.ratingGuideBody}</p>
        </div>
      </header>

      <KioskQuestionForm
        activeForm={activeForm}
        initialUserName={query.userName ?? ""}
        initialAssistedEmployee={query.assistedEmployee ?? ""}
        text={text}
        submitFeedback={submitFeedback}
      />
    </main>
  );
}
