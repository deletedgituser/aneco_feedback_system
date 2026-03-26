"use client";

import { useMemo, useState } from "react";

type SubmissionItem = {
  feedbackId: number;
  userName: string | null;
  assistedEmployee: string | null;
  submittedAt: string;
  responses: Array<{
    responseId: number;
    answerValue: number;
    questionLabel: string;
  }>;
};

type FormResponseModalListProps = {
  submissions: SubmissionItem[];
};

function scoreLabel(score: number): string {
  switch (score) {
    case 1:
      return "Very Dissatisfied";
    case 2:
      return "Dissatisfied";
    case 3:
      return "Neutral";
    case 4:
      return "Satisfied";
    case 5:
      return "Very Satisfied";
    default:
      return `Score ${score}`;
  }
}

function formatDateTime(dateText: string): string {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    return dateText;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FormResponseModalList({ submissions }: FormResponseModalListProps) {
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.feedbackId === selectedFeedbackId) ?? null,
    [submissions, selectedFeedbackId],
  );

  return (
    <>
      <ul className="space-y-2">
        {submissions.map((submission) => (
          <li key={submission.feedbackId} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-text-default">
                <p className="font-medium text-text-default">
                  {submission.userName?.trim() ? submission.userName : "Anonymous"}
                </p>
                <p className="text-xs text-text-muted">Submitted: {formatDateTime(submission.submittedAt)}</p>
                <p className="text-xs text-text-muted">
                  Assisted employee: {submission.assistedEmployee?.trim() ? submission.assistedEmployee : "Not specified"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedbackId(submission.feedbackId)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-soft"
              >
                Open Response
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedSubmission ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-text-default">Submission Details</h3>
                <p className="text-xs text-text-muted">Submitted: {formatDateTime(selectedSubmission.submittedAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedbackId(null)}
                className="rounded-xl border border-border px-2.5 py-1 text-xs font-semibold text-text-default hover:bg-surface-soft"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="grid gap-2 rounded-2xl border border-border bg-surface-soft p-3 text-sm text-text-default sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-text-default">User:</span>{" "}
                  {selectedSubmission.userName?.trim() ? selectedSubmission.userName : "Anonymous"}
                </p>
                <p>
                  <span className="font-semibold text-text-default">Assisted employee:</span>{" "}
                  {selectedSubmission.assistedEmployee?.trim() ? selectedSubmission.assistedEmployee : "Not specified"}
                </p>
              </div>

              <ul className="space-y-2">
                {selectedSubmission.responses.map((response) => (
                  <li key={response.responseId} className="rounded-2xl border border-border bg-surface p-3">
                    <p className="text-sm font-medium text-text-default">{response.questionLabel}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-default">
                      <span className="rounded-full bg-accent/28 px-2 py-1 text-xs font-semibold text-text-default">
                        Value: {response.answerValue}/5
                      </span>
                      <span className="rounded-full bg-surface-soft px-2 py-1 text-xs font-semibold text-text-default">
                        Rate: {scoreLabel(response.answerValue)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
