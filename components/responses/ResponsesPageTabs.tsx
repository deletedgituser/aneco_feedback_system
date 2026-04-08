"use client";

import { useState } from "react";
import { RatingDistributionChart } from "./RatingDistributionChart";
import { SurveyResponseTallyTable } from "./SurveyResponseTallyTable";
import { FormResponseModalList } from "@/components/dashboard/form-response-modal-list";
import { FlashToast } from "@/components/ui/flash-toast";
import type { PerQuestionStat, SentimentType } from "@/types";

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

type TallyRow = {
  questionId: number;
  questionLabel: string;
  stronglyAgree: number;
  agree: number;
  neutral: number;
  disagree: number;
  stronglyDisagree: number;
  notAnswered: number;
};

interface ResponsesPageTabsProps {
  submissions: SubmissionItem[];
  stats: PerQuestionStat[];
  distribution: Array<{ score: number; count: number }>;
  currentPage: number;
  totalPages: number;
  prevPageHref?: string;
  nextPageHref?: string;
  tallyRows: TallyRow[];
  formId: number;
  formTitle: string;
  personnelName: string;
}

export function ResponsesPageTabs({
  submissions,
  stats,
  distribution,
  currentPage,
  totalPages,
  prevPageHref,
  nextPageHref,
  tallyRows,
  formId,
  formTitle,
  personnelName,
}: ResponsesPageTabsProps) {
  const [activeTab, setActiveTab] = useState<"responses" | "analytics">("responses");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(
        `/api/exports/report-tally?formId=${formId}&format=pdf`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `survey-response-tally-${formId}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ type: "success", message: "PDF downloaded successfully." });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setToast({ type: "error", message: "Failed to download PDF. Please try again." });
    }
  };

  return (
    <div className="space-y-4">
      {toast ? <FlashToast type={toast.type} message={toast.message} /> : null}
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b-2 border-border bg-surface-soft rounded-t-2xl px-6 py-4">
        <button
          onClick={() => setActiveTab("responses")}
          className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 relative ${
            activeTab === "responses"
              ? "text-primary"
              : "text-text-muted hover:text-text-default"
          }`}
        >
          Responses
          {activeTab === "responses" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 relative ${
            activeTab === "analytics"
              ? "text-primary"
              : "text-text-muted hover:text-text-default"
          }`}
        >
          Analytics
          {activeTab === "analytics" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <div className="ml-auto">
          <button
            onClick={handleDownloadPDF}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === "responses" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">Showing latest submissions first</p>
            </div>

            <FormResponseModalList submissions={submissions} />

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-4">
              <p className="text-sm text-text-muted">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {currentPage > 1 && prevPageHref ? (
                  <a
                    href={prevPageHref}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default hover:bg-surface-soft"
                  >
                    Previous
                  </a>
                ) : (
                  <span className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted opacity-60">Previous</span>
                )}
                {currentPage < totalPages && nextPageHref ? (
                  <a
                    href={nextPageHref}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default hover:bg-surface-soft"
                  >
                    Next
                  </a>
                ) : (
                  <span className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted opacity-60">Next</span>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-default">Rating Distribution</h3>
            </div>
            <RatingDistributionChart key={distribution.map((d) => `${d.score}-${d.count}`).join("|")} data={distribution} />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-default">Survey Response Tally</h3>
              <SurveyResponseTallyTable rows={tallyRows} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
