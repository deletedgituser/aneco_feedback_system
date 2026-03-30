"use client";

import { useState } from "react";
import { RatingDistributionChart } from "./RatingDistributionChart";
import { PerQuestionPerformanceTable } from "./PerQuestionPerformanceTable";
import type { PerQuestionStat } from "@/types";

interface ResponseCardTabsProps {
  children: React.ReactNode; // Tab 1 content (Responses)
  stats: PerQuestionStat[];
  distribution: Array<{ score: number; count: number }>;
  formTitle?: string; // Form title for the analytics tab header
}

export function ResponseCardTabs({
  children,
  stats,
  distribution,
  formTitle,
}: ResponseCardTabsProps) {
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
        {activeTab === "responses" && <div>{children}</div>}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {formTitle && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-text-default">{formTitle}</h2>
              </div>
            )}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-default">Rating Distribution</h3>
              <RatingDistributionChart data={distribution} />
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
