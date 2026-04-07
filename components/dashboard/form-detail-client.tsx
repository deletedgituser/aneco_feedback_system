"use client";

import { useState } from "react";
import { QuestionItemEditor } from "@/components/dashboard/question-item-editor";
import { QuestionEditModal } from "@/components/dashboard/question-edit-modal";
import { FlashToast } from "@/components/ui/flash-toast";

type Question = {
  questionId: number;
  displayOrder: number;
  label: string;
  description: string | null;
  categoryPart: string | null;
  isOverallSatisfaction: boolean;
};

type FormDetailQuestionsClientProps = {
  questions: Question[];
  toastMessage?: string;
  toastType?: "success" | "error";
  updateQuestionAction: (formData: FormData) => Promise<void>;
  deleteQuestionAction: (formData: FormData) => Promise<void>;
};

export function FormDetailQuestionsClient({
  questions,
  toastMessage,
  toastType,
  updateQuestionAction,
  deleteQuestionAction,
}: FormDetailQuestionsClientProps) {
  const [isPending, setPending] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleUpdateQuestion = async (formData: FormData) => {
    setPending(true);
    try {
      await updateQuestionAction(formData);
      setEditingQuestion(null);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {toastType && toastMessage ? <FlashToast type={toastType} message={toastMessage} /> : null}

      <div className="space-y-2">
        {questions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
            No questions yet.
          </p>
        ) : (
          <ol className="space-y-2">
            {questions.map((question) => (
              <li key={question.questionId}>
                <QuestionItemEditor
                  question={question}
                  onEdit={setEditingQuestion}
                  deleteAction={deleteQuestionAction}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      {editingQuestion && (
        <QuestionEditModal
          isOpen={!!editingQuestion}
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSubmit={handleUpdateQuestion}
          isPending={isPending}
        />
      )}
    </>
  );
}
