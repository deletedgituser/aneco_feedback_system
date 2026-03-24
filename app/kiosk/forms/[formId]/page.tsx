import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { KioskQuestionForm } from "@/components/kiosk/kiosk-question-form";

type KioskQuestion = {
  questionId: number;
  label: string;
};

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
    submit: isBisaya ? "I-submit ang feedback" : "Submit feedback",
  };

  async function submitFeedback(formData: FormData) {
    "use server";

    const userName = String(formData.get("userName") ?? "").trim() || null;
    const assistedEmployee = String(formData.get("assistedEmployee") ?? "").trim() || null;

    const answers: { questionId: number; answerValue: number }[] = [];
    for (const question of activeForm.questions) {
      const value = Number(formData.get(`q-${question.questionId}`));
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        redirect(`/kiosk/forms/${activeForm.formId}?toastType=error&toastMessage=Please+answer+all+questions.`);
      }
      answers.push({ questionId: question.questionId, answerValue: value });
    }

    const feedback = await prisma.feedback.create({
      data: {
        formId: activeForm.formId,
        userName,
        assistedEmployee,
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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:px-5 sm:py-7">
      <header className="rounded-xl border border-border-default bg-surface p-3 shadow-sm sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Link
            href={returnUrl}
            className="inline-flex rounded-md border border-border-default px-2 py-1 text-xs font-semibold text-text-default hover:bg-brand-secondary"
          >
            Back
          </Link>

          <Image
            src="/logo.png"
            alt="ANECO logo"
            width={52}
            height={52}
            className="h-12 w-12 rounded-md object-contain"
            priority
          />
        </div>
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-text-default sm:text-xl">{activeForm.title}</h1>
        </div>
        <p className="text-sm text-text-muted">{activeForm.description}</p>
        <div className="mt-3 rounded-lg border border-border-default bg-brand-primary-soft px-3 py-2 text-xs text-text-default">
          <p className="font-semibold">{text.ratingGuideTitle}</p>
          <p className="mt-0.5">{text.ratingGuideBody}</p>
        </div>
      </header>

      <KioskQuestionForm
        activeForm={activeForm}
        initialUserName={query.userName ?? ""}
        initialAssistedEmployee={query.assistedEmployee ?? ""}
        returnUrl={returnUrl}
        text={text}
        submitFeedback={submitFeedback}
      />
    </main>
  );
}
