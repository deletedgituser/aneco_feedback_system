"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RatingDistribution {
  score: number;
  count: number;
}

interface RatingDistributionChartProps {
  data: RatingDistribution[];
}

export function RatingDistributionChart({ data }: RatingDistributionChartProps) {
  // Memoize chart configuration to ensure consistency
  const chartConfig = useMemo(() => {
    const scores = [1, 2, 3, 4, 5];
    const counts = scores.map((score) => data.find((d) => d.score === score)?.count ?? 0);

    // Use gradient-like colors based on sentiment
    const getColor = (score: number): string => {
      if (score === 1) return "#DC2626"; // Red for very dissatisfied
      if (score === 2) return "#F97316"; // Orange for dissatisfied
      if (score === 3) return "#FCD34D"; // Yellow for neutral
      if (score === 4) return "#86EFAC"; // Light green for satisfied
      return "#22C55E"; // Green for very satisfied
    };

    return {
      labels: scores.map((s) => {
        const labels = {
          1: "Very Dissatisfied",
          2: "Dissatisfied",
          3: "Neutral",
          4: "Satisfied",
          5: "Very Satisfied",
        };
        return (labels as Record<number, string>)[s] || `Score ${s}`;
      }),
      datasets: [
        {
          label: "Number of Responses",
          data: counts,
          backgroundColor: scores.map((score) => getColor(score)),
          borderColor: scores.map((score) => getColor(score)),
          borderRadius: 8,
          borderSkipped: false,
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: "x" as const, // Vertical bars
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: TooltipItem<"bar">) {
            return `Responses: ${tooltipItem.parsed.y ?? 0}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: "Number of Responses",
          font: {
            size: 12,
            weight: "bold" as const,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: "Satisfaction Level",
          font: {
            size: 12,
            weight: "bold" as const,
          },
        },
      },
    },
  }), []);

  return (
    <div className="w-full rounded-xl border border-border bg-surface-soft p-6">
      <div style={{ position: "relative", width: "100%", minHeight: "400px" }}>
        <Bar data={chartConfig} options={options} />
      </div>
    </div>
  );
}
