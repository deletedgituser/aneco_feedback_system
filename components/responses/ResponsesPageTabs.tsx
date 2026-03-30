"use client";

import { useState } from "react";
import { RatingDistributionChart } from "./RatingDistributionChart";
import { PerQuestionPerformanceTable } from "./PerQuestionPerformanceTable";
import { FormResponseModalList } from "@/components/dashboard/form-response-modal-list";
import type { PerQuestionStat, SentimentType } from "@/types";

type SubmissionItem = {
  feedbackId: number;
  userName: string | null;
  assistedEmployee: string | null;
  submittedAt: string;
  sentiment: SentimentType;
  responses: Array<{
    responseId: number;
    answerValue: number;
    questionLabel: string;
  }>;
};

interface ResponsesPageTabsProps {
  submissions: SubmissionItem[];
  stats: PerQuestionStat[];
  distribution: Array<{ score: number; count: number }>;
  currentPage: number;
  totalPages: number;
  prevPageHref?: string;
  nextPageHref?: string;
}

export function ResponsesPageTabs({
  submissions,
  stats,
  distribution,
  currentPage,
  totalPages,
  prevPageHref,
  nextPageHref,
}: ResponsesPageTabsProps) {
  const [activeTab, setActiveTab] = useState<"responses" | "analytics">("responses");

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("responses")}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-in-out ${
            activeTab === "responses"
              ? "text-primary border-b-2 border-primary"
              : "text-text-muted hover:text-text-default"
          }`}
        >
          Responses
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-in-out ${
            activeTab === "analytics"
              ? "text-primary border-b-2 border-primary"
              : "text-text-muted hover:text-text-default"
          }`}
        >
          Analytics
        </button>
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
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-default">Rating Distribution</h3>
              <RatingDistributionChart key={distribution.map((d) => `${d.score}-${d.count}`).join("|")} data={distribution} />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-default">Per Question Performance</h3>
              <PerQuestionPerformanceTable stats={stats} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
