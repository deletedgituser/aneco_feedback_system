"use client";

import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { ArcElement, Chart as ChartJS, Legend, Tooltip, type TooltipItem } from "chart.js";
import type { SentimentType } from "@/types";

ChartJS.register(ArcElement, Tooltip, Legend);

type SentimentDistribution = {
  sentiment: SentimentType;
  count: number;
};

type SentimentPieChartProps = {
  data: SentimentDistribution[];
};

const labels: Record<SentimentType, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

export function SentimentPieChart({ data }: SentimentPieChartProps) {
  const chartConfig = useMemo(() => {
    const sentiments: SentimentType[] = ["positive", "neutral", "negative"];
    const counts = sentiments.map((sentiment) => data.find((row) => row.sentiment === sentiment)?.count ?? 0);

    return {
      labels: sentiments.map((sentiment) => labels[sentiment]),
      datasets: [
        {
          label: "Submissions",
          data: counts,
          backgroundColor: ["rgb(76, 175, 80)", "rgb(233, 196, 106)", "rgb(180, 68, 48)"],
          borderColor: "rgb(255, 255, 255)",
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom" as const,
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem: TooltipItem<"pie">) => {
              const value = Number(tooltipItem.raw ?? 0);
              return `Submissions: ${value}`;
            },
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="w-full rounded-xl border border-border bg-surface-soft p-6">
      <div className="relative h-[320px] w-full">
        <Pie data={chartConfig} options={options} />
      </div>
    </div>
  );
}
