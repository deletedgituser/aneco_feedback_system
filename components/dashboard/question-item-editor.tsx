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
  moveAction?: (formData: FormData) => Promise<void>;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export function QuestionItemEditor({
  question,
  onEdit,
  deleteAction,
  moveAction,
  canMoveUp = false,
  canMoveDown = false,
}: QuestionItemEditorProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

        <div className="flex flex-wrap items-center gap-2">
          {!question.isOverallSatisfaction && moveAction ? (
            <>
              <form action={moveAction} className="flex items-center gap-2">
                <input type="hidden" name="questionId" value={question.questionId} />
                <input type="hidden" name="direction" value="up" />
                <button
                  type="submit"
                  disabled={!canMoveUp}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-default transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Up
                </button>
              </form>
              <form action={moveAction} className="flex items-center gap-2">
                <input type="hidden" name="questionId" value={question.questionId} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  disabled={!canMoveDown}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-default transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Down
                </button>
              </form>
            </>
          ) : null}

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
