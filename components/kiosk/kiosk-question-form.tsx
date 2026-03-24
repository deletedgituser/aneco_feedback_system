"use client";

import { useRef, useState } from "react";
import { FlashToast } from "@/components/ui/flash-toast";

type KioskQuestion = {
  questionId: number;
  label: string;
};

type KioskFormText = {
  ratingGuideTitle: string;
  ratingGuideBody: string;
  optionalDetails: string;
  yourName: string;
  assistedEmployee: string;
  questionLabel: string;
  of: string;
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
  returnUrl: string;
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
  returnUrl,
  text,
  submitFeedback,
}: KioskFormProps) {
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
    <form action={submitFeedback} method="post" onSubmit={handleSubmit} className="space-y-4">
      {toast ? <FlashToast type={toast.type} message={toast.message} /> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{text.optionalDetails}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">{text.yourName}</span>
            <input
              name="userName"
              defaultValue={initialUserName}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">{text.assistedEmployee}</span>
            <input
              name="assistedEmployee"
              defaultValue={initialAssistedEmployee}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {activeForm.questions.map((question, index) => {
          const isInvalid = invalidQuestions.includes(question.questionId);
          return (
            <div
              key={question.questionId}
              ref={(el) => {
                questionRefs.current[question.questionId] = el;
              }}
              className={`focus:outline-none ${isInvalid ? "ring-2 ring-rose-500" : ""}`}
              tabIndex={-1}
            >
              <div className="pb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  {text.questionLabel} {index + 1} {text.of} {activeForm.questions.length}
                </p>
                <p className="mt-1 text-lg font-semibold leading-snug text-slate-900">{question.label}</p>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {ratingOptions.map((option) => (
                  <label
                    key={option.score}
                    className="inline-flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-center text-sm transition hover:border-cyan-300 hover:bg-cyan-50 sm:min-h-20"
                    title={option.label}
                  >
                    <input
                      type="radio"
                      name={`q-${question.questionId}`}
                      value={option.score}
                      checked={answers[question.questionId] === option.score}
                      onChange={() => handleChange(question.questionId, option.score)}
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

              {index !== activeForm.questions.length - 1 ? <hr className="my-3 border-slate-200" /> : null}
            </div>
          );
        })}
      </section>

      <div>
        <button
          type="submit"
          className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
        >
          {text.submit}
        </button>
      </div>

      <input type="hidden" name="formId" value={activeForm.formId} />
    </form>
  );
}
