"use client";

import { useMemo, useState, useEffect } from "react";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import type { SentimentType } from "@/types";

type SubmissionItem = {
  feedbackId: number;
  userName: string | null;
  assistedEmployee: string | null;
  comments: string | null;
  submittedAt: string;
  sentiment: SentimentType;
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

export function FormResponseModalList({
  submissions,
}: FormResponseModalListProps) {
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.feedbackId === selectedFeedbackId) ?? null,
    [submissions, selectedFeedbackId],
  );

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedFeedbackId !== null) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [selectedFeedbackId]);

  return (
    <>
      <ul className="space-y-2">
        {submissions.map((submission) => (
          <li key={submission.feedbackId} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 text-sm text-text-default">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-default">
                    {submission.userName?.trim() ? submission.userName : "Anonymous"}
                  </p>
                  <SentimentBadge sentiment={submission.sentiment} />
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  Submitted: {formatDateTime(submission.submittedAt)}
                </p>
                <p className="text-xs text-text-muted">
                  Assisted employee:{" "}
                  {submission.assistedEmployee?.trim() ? submission.assistedEmployee : "Not specified"}
                </p>
                <p className="text-xs text-text-muted">
                  Comments: {submission.comments?.trim() ? submission.comments : "No comments"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedbackId(submission.feedbackId)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-soft whitespace-nowrap"
              >
                Open Response
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedSubmission ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedFeedbackId(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold text-text-default">Response Details</h3>
                  <p className="text-xs text-text-muted">
                    Submitted: {formatDateTime(selectedSubmission.submittedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFeedbackId(null)}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text-default hover:bg-surface-soft"
                >
                  Close
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 grid gap-2 rounded-2xl border border-border bg-surface-soft p-4 text-sm text-text-default sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-text-default">User:</span>{" "}
                    {selectedSubmission.userName?.trim() ? selectedSubmission.userName : "Anonymous"}
                  </p>
                  <p>
                    <span className="font-semibold text-text-default">Assisted employee:</span>{" "}
                    {selectedSubmission.assistedEmployee?.trim()
                      ? selectedSubmission.assistedEmployee
                      : "Not specified"}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-text-default">Comments:</span>{" "}
                    {selectedSubmission.comments?.trim() ? selectedSubmission.comments : "No comments"}
                  </p>
                </div>

                <ul className="space-y-3">
                  {selectedSubmission.responses.map((response) => (
                    <li key={response.responseId} className="rounded-2xl border border-border bg-surface p-4">
                      <p className="text-sm font-medium text-text-default">{response.questionLabel}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-text-default">
                          Score: {response.answerValue}/5
                        </span>
                        <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-text-default">
                          {scoreLabel(response.answerValue)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
