"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

type QuestionItemEditorProps = {
  question: {
    questionId: number;
    displayOrder: number;
    label: string;
    description: string | null;
    categoryPart: string | null;
    isOverallSatisfaction: boolean;
  };
  onEdit: (question: QuestionItemEditorProps["question"]) => void;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function QuestionItemEditor({ question, onEdit, deleteAction }: QuestionItemEditorProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-text-default">
              {question.displayOrder}. {question.label}
            </p>
            {question.isOverallSatisfaction ? (
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">
                Overall Satisfaction
              </span>
            ) : null}
            {question.categoryPart ? (
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                {question.categoryPart}
              </span>
            ) : null}
          </div>
          {question.description ? (
            <p className="mt-2 text-sm text-text-secondary">{question.description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(question)}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
          >
            Edit
          </button>
          {!question.isOverallSatisfaction ? (
            <form action={deleteAction}>
              <input type="hidden" name="questionId" value={question.questionId} />
              <ConfirmDeleteButton formId={question.questionId}>Delete</ConfirmDeleteButton>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
