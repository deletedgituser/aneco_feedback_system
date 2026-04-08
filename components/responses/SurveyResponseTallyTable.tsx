"use client";

import { useEffect, useState } from "react";

interface TallyRow {
  questionId: number;
  questionLabel: string;
  stronglyAgree: number; // 5
  agree: number; // 4
  neutral: number; // 3
  disagree: number; // 2
  stronglyDisagree: number; // 1
  notAnswered: number; // null/N/A
}

interface SurveyResponseTallyTableProps {
  rows: TallyRow[];
}

function calculateOverallPercentage(stronglyAgree: number, agree: number, totalResponses: number, notAnswered: number): string {
  const answeredCount = totalResponses - notAnswered;
  if (answeredCount === 0) {
    return "—";
  }
  const satisfiedCount = stronglyAgree + agree;
  const percentage = (satisfiedCount / answeredCount) * 100;
  return `${percentage.toFixed(2)}%`;
}

function getColorClass(percentage: string): string {
  if (percentage === "—") return "text-text-muted";
  const value = parseFloat(percentage);
  if (value >= 75) return "text-success font-semibold";
  if (value >= 50) return "text-warning font-semibold";
  return "text-danger font-semibold";
}

export function SurveyResponseTallyTable({ rows }: SurveyResponseTallyTableProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate totals for summary footer
  const totals = {
    stronglyAgree: 0,
    agree: 0,
    neutral: 0,
    disagree: 0,
    stronglyDisagree: 0,
    notAnswered: 0,
  };

  rows.forEach((row) => {
    totals.stronglyAgree += row.stronglyAgree;
    totals.agree += row.agree;
    totals.neutral += row.neutral;
    totals.disagree += row.disagree;
    totals.stronglyDisagree += row.stronglyDisagree;
    totals.notAnswered += row.notAnswered;
  });

  const totalResponses = totals.stronglyAgree + totals.agree + totals.neutral + totals.disagree + totals.stronglyDisagree + totals.notAnswered;
  const aggregateOverallPercentage = calculateOverallPercentage(totals.stronglyAgree, totals.agree, totalResponses, totals.notAnswered);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {rows.map((row, index) => {
          const rowTotal = row.stronglyAgree + row.agree + row.neutral + row.disagree + row.stronglyDisagree + row.notAnswered;
          const overallPercentage = calculateOverallPercentage(row.stronglyAgree, row.agree, rowTotal, row.notAnswered);
          return (
            <div key={row.questionId} className="rounded-xl border border-border bg-surface-soft p-4 space-y-2">
              <h3 className="font-semibold text-text-default">
                {index + 1}. {row.questionLabel}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Strongly Agree</span>
                  <span className="font-semibold text-text-default">{row.stronglyAgree}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Agree</span>
                  <span className="font-semibold text-text-default">{row.agree}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Neutral</span>
                  <span className="font-semibold text-text-default">{row.neutral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Disagree</span>
                  <span className="font-semibold text-text-default">{row.disagree}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Strongly Disagree</span>
                  <span className="font-semibold text-text-default">{row.stronglyDisagree}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">N/A</span>
                  <span className="font-semibold text-text-default">{row.notAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total</span>
                  <span className="font-semibold text-text-default">{rowTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Overall (%)</span>
                  <span className={getColorClass(overallPercentage)}>{overallPercentage}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary text-text-inverse">
            <th className="px-3 py-3 text-center font-semibold">#</th>
            <th className="px-3 py-3 text-left font-semibold min-w-[280px]">Survey Question</th>
            <th className="px-3 py-3 text-center font-semibold">Strongly Agree</th>
            <th className="px-3 py-3 text-center font-semibold">Agree</th>
            <th className="px-3 py-3 text-center font-semibold">Neutral</th>
            <th className="px-3 py-3 text-center font-semibold">Disagree</th>
            <th className="px-3 py-3 text-center font-semibold">Strongly Disagree</th>
            <th className="px-3 py-3 text-center font-semibold">N/A</th>
            <th className="px-3 py-3 text-center font-semibold">Total Responses</th>
            <th className="px-3 py-3 text-center font-semibold">Overall (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowTotal = row.stronglyAgree + row.agree + row.neutral + row.disagree + row.stronglyDisagree + row.notAnswered;
            const overallPercentage = calculateOverallPercentage(row.stronglyAgree, row.agree, rowTotal, row.notAnswered);
            return (
              <tr key={row.questionId} className={index % 2 === 0 ? "bg-surface" : "bg-surface-soft"}>
                <td className="px-3 py-3 text-center text-text-default font-medium">{index + 1}</td>
                <td className="px-3 py-3 text-left text-text-default">{row.questionLabel}</td>
                <td className="px-3 py-3 text-center text-text-default">{row.stronglyAgree}</td>
                <td className="px-3 py-3 text-center text-text-default">{row.agree}</td>
                <td className="px-3 py-3 text-center text-text-default">{row.neutral}</td>
                <td className="px-3 py-3 text-center text-text-default">{row.disagree}</td>
                <td className="px-3 py-3 text-center text-text-default">{row.stronglyDisagree}</td>
                <td className="px-3 py-3 text-center text-text-default">{row.notAnswered}</td>
                <td className="px-3 py-3 text-center text-text-default font-medium">{rowTotal}</td>
                <td className={`px-3 py-3 text-center ${getColorClass(overallPercentage)}`}>{overallPercentage}</td>
              </tr>
            );
          })}
          {/* Summary Footer Row */}
          <tr className="bg-primary text-text-inverse font-semibold">
            <td colSpan={2} className="px-3 py-3 text-left">
              Total
            </td>
            <td className="px-3 py-3 text-center">{totals.stronglyAgree}</td>
            <td className="px-3 py-3 text-center">{totals.agree}</td>
            <td className="px-3 py-3 text-center">{totals.neutral}</td>
            <td className="px-3 py-3 text-center">{totals.disagree}</td>
            <td className="px-3 py-3 text-center">{totals.stronglyDisagree}</td>
            <td className="px-3 py-3 text-center">{totals.notAnswered}</td>
            <td className="px-3 py-3 text-center">{totalResponses}</td>
            <td className="px-3 py-3 text-center">{aggregateOverallPercentage}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
