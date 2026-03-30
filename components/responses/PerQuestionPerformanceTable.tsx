"use client";

import { useEffect, useState } from "react";
import type { PerQuestionStat } from "@/types";

interface PerQuestionPerformanceTableProps {
  stats: PerQuestionStat[];
}

export function PerQuestionPerformanceTable({ stats }: PerQuestionPerformanceTableProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.questionId} className="rounded-xl border border-border bg-surface-soft p-4">
            <h3 className="font-semibold text-text-default mb-3">{stat.label}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Average Score</span>
                <span className="font-semibold text-text-default">{stat.averageRating.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Highest Score</span>
                <span className="font-semibold text-success">{stat.highestScore}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Lowest Score</span>
                <span className="font-semibold text-error">{stat.lowestScore}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Responses</span>
                <span className="font-semibold text-text-default">{stat.totalResponses}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-semibold text-text-default">Question</th>
            <th className="px-4 py-3 text-right font-semibold text-text-default">Avg Score</th>
            <th className="px-4 py-3 text-right font-semibold text-text-default">Highest</th>
            <th className="px-4 py-3 text-right font-semibold text-text-default">Lowest</th>
            <th className="px-4 py-3 text-right font-semibold text-text-default">Responses</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.questionId} className="border-b border-border hover:bg-surface-soft transition">
              <td className="px-4 py-3 text-text-default">{stat.label}</td>
              <td className="px-4 py-3 text-right font-medium text-text-default">{stat.averageRating.toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-medium text-success">{stat.highestScore}</td>
              <td className="px-4 py-3 text-right font-medium text-error">{stat.lowestScore}</td>
              <td className="px-4 py-3 text-right font-medium text-text-default">{stat.totalResponses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
