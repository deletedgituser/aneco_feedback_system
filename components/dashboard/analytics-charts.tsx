"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  BarElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

function scoreToLabel(score: number): string {
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

function formatDateLabel(dateText: string): string {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    return dateText;
  }
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type FormOption = {
  formId: number;
  title: string;
};

type AnalyticsChartsProps = {
  forms: FormOption[];
  distribution: Array<{ score: number; count: number }>;
  trend: Array<{ date: string; count: number }>;
  perForm: Array<{ formId: number; title: string; averageRating: number; totalResponses: number }>;
  perQuestion: Array<{ questionId: number; label: string; averageRating: number; totalResponses: number }>;
};

export function AnalyticsCharts({ forms, distribution, trend, perForm, perQuestion }: AnalyticsChartsProps) {
  const [selectedForm, setSelectedForm] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assistedEmployee, setAssistedEmployee] = useState("");
  const [debouncedEmployee, setDebouncedEmployee] = useState("");
  const [distributionRows, setDistributionRows] = useState(distribution);
  const [trendRows, setTrendRows] = useState(trend);
  const [perFormRows, setPerFormRows] = useState(perForm);
  const [perQuestionRows, setPerQuestionRows] = useState(perQuestion);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedEmployee(assistedEmployee);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [assistedEmployee]);

  useEffect(() => {
    let active = true;

    async function loadFilteredCharts() {
      const hasFilters =
        selectedForm !== "all" ||
        Boolean(fromDate) ||
        Boolean(toDate) ||
        Boolean(debouncedEmployee.trim());

      if (!hasFilters) {
        setDistributionRows(distribution);
        setTrendRows(trend);
        setPerFormRows(perForm);
        setPerQuestionRows(perQuestion);
        setErrorMessage("");
        setLoading(false);
        return;
      }

      if (fromDate && toDate && fromDate > toDate) {
        setErrorMessage("The 'From' date must be earlier than or equal to the 'To' date.");
        setDistributionRows(distribution);
        setTrendRows(trend);
        setPerFormRows(perForm);
        setPerQuestionRows(perQuestion);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams();
        if (selectedForm !== "all") {
          params.set("formId", selectedForm);
        }
        if (fromDate) {
          params.set("from", fromDate);
        }
        if (toDate) {
          params.set("to", toDate);
        }
        if (debouncedEmployee.trim()) {
          params.set("assistedEmployee", debouncedEmployee.trim());
        }

        const query = params.toString();
        const url = query ? `/api/analytics/charts?${query}` : "/api/analytics/charts";
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load analytics data.");
        }

        const payload = (await response.json()) as {
          distribution?: Array<{ score: number; count: number }>;
          trend?: Array<{ date: string; count: number }>;
          perForm?: Array<{ formId: number; title: string; averageRating: number; totalResponses: number }>;
          perQuestion?: Array<{ questionId: number; label: string; averageRating: number; totalResponses: number }>;
        };

        if (!active) {
          return;
        }

        setDistributionRows(payload.distribution ?? []);
        setTrendRows(payload.trend ?? []);
        setPerFormRows(payload.perForm ?? []);
        setPerQuestionRows(payload.perQuestion ?? []);
      } catch {
        if (!active) {
          return;
        }
        setErrorMessage("Unable to load filtered analytics. Showing latest available data.");
        setDistributionRows(distribution);
        setTrendRows(trend);
        setPerFormRows(perForm);
        setPerQuestionRows(perQuestion);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFilteredCharts();

    return () => {
      active = false;
    };
  }, [selectedForm, fromDate, toDate, debouncedEmployee, distribution, trend, perForm, perQuestion]);

  const hasDistributionData = distributionRows.some((row) => row.count > 0);
  const hasTrendData = trendRows.some((row) => row.count > 0);
  const hasPerFormData = perFormRows.length > 0;
  const hasPerQuestionData = perQuestionRows.length > 0;

  const distributionData = useMemo(
    () => ({
      labels: distributionRows.map((row) => scoreToLabel(row.score)),
      datasets: [
        {
          label: "Responses",
          data: distributionRows.map((row) => row.count),
          backgroundColor: [
            "rgba(225, 29, 72, 0.85)",
            "rgba(249, 115, 22, 0.85)",
            "rgba(234, 179, 8, 0.85)",
            "rgba(34, 197, 94, 0.85)",
            "rgba(6, 182, 212, 0.85)",
          ],
          borderColor: "rgba(255,255,255,0.9)",
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    }),
    [distributionRows],
  );

  const trendData = useMemo(
    () => ({
      labels: trendRows.map((row) => formatDateLabel(row.date)),
      datasets: [
        {
          label: "Submissions",
          data: trendRows.map((row) => row.count),
          backgroundColor: "rgba(8, 145, 178, 0.78)",
          borderColor: "rgba(14, 116, 144, 1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [trendRows],
  );

  const perFormData = useMemo(
    () => ({
      labels: perFormRows.map((row) => row.title),
      datasets: [
        {
          label: "Average Rating",
          data: perFormRows.map((row) => row.averageRating),
          backgroundColor: "rgba(16, 185, 129, 0.75)",
          borderColor: "rgba(5, 150, 105, 1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [perFormRows],
  );

  const perQuestionData = useMemo(
    () => ({
      labels: perQuestionRows.map((row) => row.label.length > 48 ? `${row.label.slice(0, 48)}...` : row.label),
      datasets: [
        {
          label: "Average Rating",
          data: perQuestionRows.map((row) => row.averageRating),
          backgroundColor: "rgba(99, 102, 241, 0.75)",
          borderColor: "rgba(79, 70, 229, 1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [perQuestionRows],
  );

  const exportBaseQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedForm !== "all") {
      params.set("formId", selectedForm);
    }
    if (fromDate) {
      params.set("from", fromDate);
    }
    if (toDate) {
      params.set("to", toDate);
    }
    if (debouncedEmployee.trim()) {
      params.set("assistedEmployee", debouncedEmployee.trim());
    }
    return params;
  }, [selectedForm, fromDate, toDate, debouncedEmployee]);

  function exportHref(mode: "summary" | "detailed", format: "excel" | "pdf"): string {
    const params = new URLSearchParams(exportBaseQuery);
    params.set("mode", mode);
    params.set("format", format);
    return `/api/exports/report?${params.toString()}`;
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="form-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Form Filter
          </label>
          <select
            id="form-filter"
            value={selectedForm}
            onChange={(event) => setSelectedForm(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All forms</option>
            {forms.map((form) => (
              <option key={form.formId} value={String(form.formId)}>
                {form.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="from-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="to-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="assisted-employee" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Assisted Employee
          </label>
          <input
            id="assisted-employee"
            value={assistedEmployee}
            onChange={(event) => setAssistedEmployee(event.target.value)}
            placeholder="Name"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedForm("all");
            setFromDate("");
            setToDate("");
            setAssistedEmployee("");
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Reset filters
        </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={exportHref("summary", "excel")}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Summary Excel
          </a>
          <a
            href={exportHref("summary", "pdf")}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Summary PDF
          </a>
          <a
            href={exportHref("detailed", "excel")}
            className="rounded-md border border-cyan-300 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
          >
            Detailed Excel
          </a>
          <a
            href={exportHref("detailed", "pdf")}
            className="rounded-md border border-cyan-300 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
          >
            Detailed PDF
          </a>
        </div>
      </div>

      {loading ? <p className="text-xs text-slate-500">Loading analytics...</p> : null}
      {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Rating Mix</h2>
          {hasDistributionData ? (
            <div className="h-72">
              <Bar
                data={distributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  animation: {
                    duration: 300,
                  },
                }}
              />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No responses found for the current filters.
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Daily Submission Volume</h2>
          {hasTrendData ? (
            <div className="h-72">
              <Bar
                data={trendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  animation: {
                    duration: 300,
                  },
                }}
              />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No submissions found for the current filters.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Per-Form Performance</h2>
          {hasPerFormData ? (
            <div className="h-80">
              <Bar
                data={perFormData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 30,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      min: 0,
                      max: 5,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  animation: {
                    duration: 300,
                  },
                }}
              />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No form performance data for the current filters.
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Per-Question Performance</h2>
          {hasPerQuestionData ? (
            <div className="h-80">
              <Bar
                data={perQuestionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 50,
                        minRotation: 35,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      min: 0,
                      max: 5,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  animation: {
                    duration: 300,
                  },
                }}
              />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No question performance data for the current filters.
            </p>
          )}
        </div>
      </div>

      {selectedForm !== "all" || fromDate || toDate || assistedEmployee.trim() ? (
        <p className="text-xs text-slate-500">
          Filters applied to analytics charts.
        </p>
      ) : null}
    </section>
  );
}
