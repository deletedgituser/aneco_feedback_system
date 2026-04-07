"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FlashToast } from "@/components/ui/flash-toast";

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
  const [invalidQuestions, setInvalidQuestions] = useState<number[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleChange = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (invalidQuestions.includes(questionId)) {
      setInvalidQuestions((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleCancel = () => {
    router.push("/kiosk");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const unanswered = activeForm.questions
      .filter((question) => !answers[question.questionId])
      .map((question) => question.questionId);

    if (unanswered.length > 0) {
      event.preventDefault();
      setInvalidQuestions(unanswered);
      setToast({ type: "error", message: "Please complete all ratings before submitting." });

      const firstInvalidRef = questionRefs.current[unanswered[0]];
      if (firstInvalidRef) {
        firstInvalidRef.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalidRef.focus();
      }
      return;
    }

    // let the form submit to server action
  };

  return (
    <form action={submitFeedback} onSubmit={handleSubmit} className="space-y-4">
      {toast ? <FlashToast type={toast.type} message={toast.message} /> : null}

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{text.optionalDetails}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-text-default">{text.yourName}</span>
            <input
              name="userName"
              defaultValue={initialUserName}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-text-default">{text.assistedEmployee}</span>
            <input
              name="assistedEmployee"
              defaultValue={initialAssistedEmployee}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
        <div className="space-y-8">
          {(() => {
            // Group questions by categoryPart, excluding overall satisfaction
            const nonOverallQuestions = activeForm.questions.filter((q) => !q.isOverallSatisfaction);
            const overallQuestion = activeForm.questions.find((q) => q.isOverallSatisfaction);
            
            // Group non-overall questions by categoryPart
            const groupedQuestions = nonOverallQuestions.reduce(
              (acc, question, idx) => {
                const category = question.categoryPart || "Uncategorized";
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push({ ...question, index: idx });
                return acc;
              },
              {} as Record<string, Array<KioskQuestion & { index: number }>>
            );

            return (
              <>
                {Object.entries(groupedQuestions).map(([category, questions]) => (
                  <div key={category} className="space-y-4">
                    {category !== "Uncategorized" && (
                      <div className="border-b-2 border-border pb-2">
                        <p className="text-sm font-bold uppercase tracking-widest text-primary">{category}</p>
                      </div>
                    )}
                    {questions.map((question) => {
                      const isInvalid = invalidQuestions.includes(question.questionId);
                      return (
                        <div
                          key={question.questionId}
                          ref={(el) => {
                            questionRefs.current[question.questionId] = el;
                          }}
                          className={`rounded-2xl border border-border bg-surface-soft p-5 focus:outline-none sm:p-6 ${
                            isInvalid ? "ring-2 ring-rose-500" : ""
                          }`}
                          tabIndex={-1}
                        >
                          <div className="pb-5">
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-bold text-text-default">
                                <span className="text-primary">{question.index + 1}.</span> {question.label}
                              </p>
                            </div>
                            {question.description ? (
                              <p className="mt-2 text-base font-normal leading-relaxed text-text-secondary">{question.description}</p>
                            ) : null}
                          </div>

                          <div className="grid grid-cols-5 gap-2">
                            {ratingOptions.map((option) => (
                              <label
                                key={option.score}
                                className="inline-flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface-soft px-1.5 py-2 text-center text-sm transition hover:border-primary hover:bg-surface sm:min-h-24"
                                title={option.label}
                              >
                                <input
                                  type="radio"
                                  name={`q-${question.questionId}`}
                                  value={option.score}
                                  checked={answers[question.questionId] === option.score}
                                  onChange={() => handleChange(question.questionId, option.score)}
                                  aria-label={`${option.score} - ${option.label}`}
                                  className="h-5 w-5 accent-primary"
                                />
                                <span className="text-xl leading-none" aria-hidden="true">
                                  {option.emoji}
                                </span>
                                <span className="text-sm font-bold text-text-default">{option.score}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {overallQuestion && (
                  <div className="space-y-4 border-t-2 border-border pt-6 mt-6">
                    <div className="pb-2">
                      <p className="text-sm font-bold uppercase tracking-widest text-primary">Overall</p>
                    </div>
                    {(() => {
                      const index = activeForm.questions.length - 1;
                      const isInvalid = invalidQuestions.includes(overallQuestion.questionId);
                      return (
                        <div
                          key={overallQuestion.questionId}
                          ref={(el) => {
                            questionRefs.current[overallQuestion.questionId] = el;
                          }}
                          className={`rounded-2xl border border-border bg-surface-soft p-5 focus:outline-none sm:p-6 ${
                            isInvalid ? "ring-2 ring-rose-500" : ""
                          }`}
                          tabIndex={-1}
                        >
                          <div className="pb-5">
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-bold text-text-default">
                                <span className="text-primary">{index + 1}.</span> {overallQuestion.label}
                              </p>
                            </div>
                            {overallQuestion.description ? (
                              <p className="mt-2 text-base font-normal leading-relaxed text-text-secondary">{overallQuestion.description}</p>
                            ) : null}
                          </div>

                          <div className="grid grid-cols-5 gap-2">
                            {ratingOptions.map((option) => (
                              <label
                                key={option.score}
                                className="inline-flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface-soft px-1.5 py-2 text-center text-sm transition hover:border-primary hover:bg-surface sm:min-h-24"
                                title={option.label}
                              >
                                <input
                                  type="radio"
                                  name={`q-${overallQuestion.questionId}`}
                                  value={option.score}
                                  checked={answers[overallQuestion.questionId] === option.score}
                                  onChange={() => handleChange(overallQuestion.questionId, option.score)}
                                  aria-label={`${option.score} - ${option.label}`}
                                  className="h-5 w-5 accent-primary"
                                />
                                <span className="text-xl leading-none" aria-hidden="true">
                                  {option.emoji}
                                </span>
                                <span className="text-sm font-bold text-text-default">{option.score}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_30px_-18px_rgba(31,45,44,0.35)]">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{text.commentsLabel}</span>
          <textarea
            name="comments"
            placeholder={text.commentsPlaceholder}
            className="h-28 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </label>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-default transition hover:bg-surface-soft"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
        >
          {text.submit}
        </button>
      </div>

      <input type="hidden" name="formId" value={activeForm.formId} />
    </form>
  );
}
