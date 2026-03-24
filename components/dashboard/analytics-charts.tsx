"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  BarElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatDateLabel(dateText: string): string {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    return dateText;
  }
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type PerformanceStatus = "positive" | "neutral" | "negative" | "no-data";

function assessPerformance(averageRating: number, totalResponses: number): {
  status: PerformanceStatus;
  label: string;
} {
  if (totalResponses === 0) {
    return { status: "no-data", label: "No Data" };
  }
  if (averageRating >= 4) {
    return { status: "positive", label: "Positive" };
  }
  if (averageRating <= 2.5) {
    return { status: "negative", label: "Negative" };
  }
  return { status: "neutral", label: "Neutral" };
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

export function AnalyticsCharts({ forms, trend, perForm }: AnalyticsChartsProps) {
  const [selectedForm, setSelectedForm] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assistedEmployee, setAssistedEmployee] = useState("");
  const [debouncedEmployee, setDebouncedEmployee] = useState("");
  const [trendRows, setTrendRows] = useState(trend);
  const [perFormRows, setPerFormRows] = useState(perForm);
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
        setTrendRows(trend);
        setPerFormRows(perForm);
        setErrorMessage("");
        setLoading(false);
        return;
      }

      if (fromDate && toDate && fromDate > toDate) {
        setErrorMessage("The 'From' date must be earlier than or equal to the 'To' date.");
        setTrendRows(trend);
        setPerFormRows(perForm);
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
          trend?: Array<{ date: string; count: number }>;
          perForm?: Array<{ formId: number; title: string; averageRating: number; totalResponses: number }>;
        };

        if (!active) {
          return;
        }

        setTrendRows(payload.trend ?? []);
        setPerFormRows(payload.perForm ?? []);
      } catch {
        if (!active) {
          return;
        }
        setErrorMessage("Unable to load filtered analytics. Showing latest available data.");
        setTrendRows(trend);
        setPerFormRows(perForm);
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
  }, [selectedForm, fromDate, toDate, debouncedEmployee, trend, perForm]);

  const hasTrendData = trendRows.some((row) => row.count > 0);
  const hasPerFormData = perFormRows.some((row) => row.totalResponses > 0);

  const trendData = useMemo(
    () => ({
      labels: trendRows.map((row) => formatDateLabel(row.date)),
      datasets: [
        {
          label: "Submissions",
          data: trendRows.map((row) => row.count),
          backgroundColor: "rgba(8, 145, 178, 0.78)",
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
          borderRadius: 6,
        },
      ],
    }),
    [perFormRows],
  );

  const formAssessments = useMemo(
    () =>
      perFormRows.map((row) => ({
        ...row,
        ...assessPerformance(row.averageRating, row.totalResponses),
      })),
    [perFormRows],
  );

  const assessmentSummary = useMemo(() => {
    const positive = formAssessments.filter((row) => row.status === "positive").length;
    const neutral = formAssessments.filter((row) => row.status === "neutral").length;
    const negative = formAssessments.filter((row) => row.status === "negative").length;
    return { positive, neutral, negative };
  }, [formAssessments]);

  const lowestPerformingForms = useMemo(
    () =>
      formAssessments
        .filter((row) => row.totalResponses > 0)
        .sort((a, b) => a.averageRating - b.averageRating)
        .slice(0, 5),
    [formAssessments],
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

  function exportHref(mode: "summary", format: "excel" | "pdf"): string {
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
              Form
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
            Reset
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
        </div>
      </div>

      {loading ? <p className="text-xs text-slate-500">Loading analytics...</p> : null}
      {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Submission Trend</h2>
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
                    duration: 250,
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

        <div className="rounded-lg border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Form Ratings</h2>
          {hasPerFormData ? (
            <div className="h-72">
              <Bar
                data={perFormData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 40,
                        minRotation: 20,
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
                    duration: 250,
                  },
                }}
              />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No form rating data for the current filters.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-3">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Form Health Snapshot</h2>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Positive: {assessmentSummary.positive}</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Neutral: {assessmentSummary.neutral}</span>
          <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">Negative: {assessmentSummary.negative}</span>
        </div>

        {formAssessments.length > 0 ? (
          <ul className="space-y-2">
            {formAssessments.map((row) => (
              <li key={row.formId} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{row.title}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {row.averageRating.toFixed(2)} ({row.totalResponses})
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                      row.status === "positive"
                        ? "bg-emerald-100 text-emerald-700"
                        : row.status === "neutral"
                          ? "bg-amber-100 text-amber-700"
                          : row.status === "negative"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No form assessments available for the current filters.
          </p>
        )}
      </div>

      {selectedForm !== "all" || fromDate || toDate || assistedEmployee.trim() ? (
        <p className="text-xs text-slate-500">Filters applied to analytics.</p>
      ) : null}
    </section>
  );
}
