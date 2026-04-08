"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { FlashToast } from "@/components/ui/flash-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Textarea } from "@/components/ui/textarea";

type KioskQuestion = {
  questionId: number;
  label: string;
  description: string | null;
  categoryPart: string | null;
  isOverallSatisfaction: boolean;
};

type KioskFormText = {
  ratingGuideTitle: string;
  ratingGuideBody: string;
  optionalDetails: string;
  yourName: string;
  assistedEmployee: string;
  questionLabel: string;
  of: string;
  commentsLabel: string;
  commentsPlaceholder: string;
  submit: string;
  submitting: string;
  completion: string;
  overallSection: string;
  cancel: string;
};

type KioskFormProps = {
  activeForm: {
    formId: number;
    title: string;
    description: string | null;
    language: string;
    questions: KioskQuestion[];
  };
  initialUserName: string;
  initialAssistedEmployee: string;
  text: KioskFormText;
  submitFeedback: (formData: FormData) => Promise<void>;
};

const ratingOptions = [
  { score: 1, emoji: "😠", label: "Very unsatisfied" },
  { score: 2, emoji: "🙁", label: "Unsatisfied" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "🙂", label: "Satisfied" },
  { score: 5, emoji: "😄", label: "Very satisfied" },
];

export function KioskQuestionForm({
  activeForm,
  initialUserName,
  initialAssistedEmployee,
  text,
  submitFeedback,
}: KioskFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [toast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const nonOverallQuestions = useMemo(
    () => activeForm.questions.filter((question) => !question.isOverallSatisfaction),
    [activeForm.questions],
  );
  const overallQuestion = useMemo(
    () => activeForm.questions.find((question) => question.isOverallSatisfaction),
    [activeForm.questions],
  );

  const groupedQuestions = useMemo(() => {
    return nonOverallQuestions.reduce(
      (acc, question, idx) => {
        const category = question.categoryPart || "General";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({ ...question, index: idx + 1 });
        return acc;
      },
      {} as Record<string, Array<KioskQuestion & { index: number }>>,
    );
  }, [nonOverallQuestions]);

  const answeredCount = useMemo(() => {
    return activeForm.questions.reduce((count, question) => {
      return answers[question.questionId] ? count + 1 : count;
    }, 0);
  }, [activeForm.questions, answers]);

  const totalQuestions = activeForm.questions.length;
  const completionPercentage = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  const handleChange = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCancel = () => {
    router.push("/kiosk");
  };

  return (
    <form action={submitFeedback} className="mt-6 space-y-6">
      {toast ? <FlashToast type={toast.type} message={toast.message} /> : null}

      <section className="motion-fade-up rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{text.completion}</h2>
            <span className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-semibold text-text-default">
              {answeredCount} / {totalQuestions}
            </span>
          </div>
          <ProgressBar value={completionPercentage} />
        </div>
      </section>

      <section className="motion-fade-up rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{text.optionalDetails}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-default">{text.yourName}</span>
            <Input
              name="userName"
              defaultValue={initialUserName}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-text-default">{text.assistedEmployee}</span>
            <Input
              name="assistedEmployee"
              defaultValue={initialAssistedEmployee}
            />
          </label>
        </div>
      </section>

      <section className="motion-fade-up rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="space-y-10">
          {Object.entries(groupedQuestions).map(([category, questions]) => (
            <div key={category} className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="text-sm font-bold uppercase tracking-widest text-primary">{category}</p>
                <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-text-default ring-1 ring-primary/20">
                  {questions.length} {questions.length === 1 ? "question" : "questions"}
                </span>
              </div>

              <div className="space-y-6">
                {questions.map((question) => {
                  return (
                    <div key={question.questionId} className="rounded-2xl border border-border bg-surface-soft p-5 shadow-sm sm:p-6">
                      <div className="pb-5">
                        <p className="inline-flex items-center rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-default ring-1 ring-primary/20">
                          {text.questionLabel} {question.index} {text.of} {activeForm.questions.length}
                        </p>

                        <p className="mt-3 text-lg font-bold leading-snug text-text-default sm:text-xl">
                          {question.label}
                        </p>
                        {question.description ? (
                          <p className="mt-2 text-sm font-normal leading-relaxed text-text-secondary sm:text-base">
                            {question.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-5 gap-2 sm:gap-3">
                        {ratingOptions.map((option) => {
                          const isActive = answers[question.questionId] === option.score;
                          return (
                            <label
                              key={option.score}
                              className={[
                                "inline-flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center text-sm",
                                "transition-colors duration-150 ease-in-out motion-reduce:transition-none",
                                "hover:border-primary hover:bg-surface active:bg-surface",
                                isActive
                                  ? "border-primary bg-surface text-text-default ring-2 ring-primary/15"
                                  : "border-border bg-surface-soft text-text-secondary",
                              ].join(" ")}
                              title={option.label}
                            >
                              <input
                                type="radio"
                                name={`q-${question.questionId}`}
                                value={option.score}
                                checked={isActive}
                                onChange={() => handleChange(question.questionId, option.score)}
                                aria-label={`${option.score} - ${option.label}`}
                                className="h-5 w-5 accent-primary"
                              />
                              <span className="text-xl leading-none" aria-hidden="true">
                                {option.emoji}
                              </span>
                              <span className="text-sm font-bold text-text-default">{option.score}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {overallQuestion ? (
            <div className="space-y-5 border-t border-border pt-8">
              <div className="pb-2">
                <p className="text-sm font-bold uppercase tracking-widest text-primary">{text.overallSection}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-soft p-5 shadow-sm sm:p-6">
                <div className="pb-5">
                  <p className="inline-flex items-center rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-default ring-1 ring-primary/20">
                    {text.questionLabel} {activeForm.questions.length} {text.of} {activeForm.questions.length}
                  </p>

                  <p className="mt-3 text-lg font-bold leading-snug text-text-default sm:text-xl">
                    {overallQuestion.label}
                  </p>
                  {overallQuestion.description ? (
                    <p className="mt-2 text-sm font-normal leading-relaxed text-text-secondary sm:text-base">
                      {overallQuestion.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {ratingOptions.map((option) => {
                    const isActive = answers[overallQuestion.questionId] === option.score;
                    return (
                      <label
                        key={option.score}
                        className={[
                          "inline-flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center text-sm",
                          "transition-colors duration-150 ease-in-out motion-reduce:transition-none",
                          "hover:border-primary hover:bg-surface active:bg-surface",
                          isActive
                            ? "border-primary bg-surface text-text-default ring-2 ring-primary/15"
                            : "border-border bg-surface-soft text-text-secondary",
                        ].join(" ")}
                        title={option.label}
                      >
                        <input
                          type="radio"
                          name={`q-${overallQuestion.questionId}`}
                          value={option.score}
                          checked={isActive}
                          onChange={() => handleChange(overallQuestion.questionId, option.score)}
                          aria-label={`${option.score} - ${option.label}`}
                          className="h-5 w-5 accent-primary"
                        />
                        <span className="text-xl leading-none" aria-hidden="true">
                          {option.emoji}
                        </span>
                        <span className="text-sm font-bold text-text-default">{option.score}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="motion-fade-up rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{text.commentsLabel}</span>
          <Textarea
            name="comments"
            placeholder={text.commentsPlaceholder}
            className="h-28"
          />
        </label>
      </section>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleCancel}
          variant="secondary"
        >
          {text.cancel}
        </Button>
        <SubmitFeedbackButton submitLabel={text.submit} submittingLabel={text.submitting} />
      </div>

      <input type="hidden" name="formId" value={activeForm.formId} />
    </form>
  );
}

type SubmitFeedbackButtonProps = {
  submitLabel: string;
  submittingLabel: string;
};

function SubmitFeedbackButton({ submitLabel, submittingLabel }: SubmitFeedbackButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={pending ? "motion-pulse-soft" : ""}
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? submittingLabel : submitLabel}
    </Button>
  );
}
