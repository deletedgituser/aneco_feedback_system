"use client";

import { FormEvent, useState } from "react";

type QuestionEditModalProps = {
  isOpen: boolean;
  question: {
    questionId: number;
    displayOrder: number;
    label: string;
    description: string | null;
    categoryPart: string | null;
  };
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  isPending: boolean;
};

export function QuestionEditModal({
  isOpen,
  question,
  onClose,
  onSubmit,
  isPending,
}: QuestionEditModalProps) {
  const [label, setLabel] = useState(question.label);
  const [description, setDescription] = useState(question.description ?? "");
  const [categoryPart, setCategoryPart] = useState(question.categoryPart ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!label.trim()) {
      event.preventDefault();
      setError("Question text is required.");
      return;
    }

    setError(null);
    const formData = new FormData(event.currentTarget);
    await onSubmit(formData);
    onClose();
  };

  const handleCancel = () => {
    setError(null);
    setLabel(question.label);
    setDescription(question.description ?? "");
    setCategoryPart(question.categoryPart ?? "");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-default">Edit Question</h2>
          <p className="mt-1 text-sm text-text-secondary">Question {question.displayOrder}</p>
        </div>

        <form action={onSubmit} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="questionId" value={question.questionId} />

          <div>
            <label htmlFor="modal-label" className="mb-2 block text-sm font-bold text-text-default">
              Question Text *
            </label>
            <input
              id="modal-label"
              name="label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter the main question"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="modal-category" className="mb-2 block text-sm font-semibold text-text-default">
                Category/Part
              </label>
              <input
                id="modal-category"
                name="categoryPart"
                value={categoryPart}
                onChange={(event) => setCategoryPart(event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Part 1, Service Quality"
                maxLength={120}
              />
              <p className="mt-1 text-xs text-text-muted">{categoryPart.length}/120 characters</p>
            </div>
            <div>
              <label htmlFor="modal-desc" className="mb-2 block text-sm font-semibold text-text-default">
                Short Description
              </label>
              <input
                id="modal-desc"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Optional helper text for respondents"
              />
            </div>
          </div>

          {error && <div className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div>}

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending || !label.trim()}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-default transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
