"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const fallbackChartPalette = {
  primary: "rgb(62, 95, 92)",
  success: "rgb(212, 160, 23)",
};

function getISOWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekLabel(startDate: Date, endDate: Date): string {
  const start = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(startDate);
  const end = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(endDate);
  return `${start} – ${end}`;
}

function getDayLabel(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()] + " " + new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function getWeekEndDate(startDate: Date): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + 6);
  return end;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type TrendRow = { date: string; count: number };

type FormOption = {
  formId: number;
  title: string;
};

type AnalyticsChartsProps = {
  forms: FormOption[];
  distribution: Array<{ score: number; count: number }>;
  trend: Array<{ date: string; count: number }>;
  perFormSubmissions?: Array<{ formId: number; title: string; submissions: number }>;
};

export function AnalyticsCharts({ forms, trend, perFormSubmissions }: AnalyticsChartsProps) {
  const [selectedForm, setSelectedForm] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [trendRows, setTrendRows] = useState(trend);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [chartTitle, setChartTitle] = useState("Submissions");

  const chartPalette = useMemo(() => {
    if (typeof window === "undefined") {
      return fallbackChartPalette;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const primary = rootStyles.getPropertyValue("--chart-primary").trim() || fallbackChartPalette.primary;
    const success = rootStyles.getPropertyValue("--chart-success").trim() || fallbackChartPalette.success;

    return { primary, success };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFilteredTrend() {
      const hasFilters = selectedForm !== "all" || Boolean(fromDate) || Boolean(toDate);

      if (!hasFilters) {
        setTrendRows(trend);
        setChartTitle("Submissions");
        setErrorMessage("");
        setLoading(false);
        return;
      }

      if (fromDate && toDate && fromDate > toDate) {
        setErrorMessage("The 'From' date must be earlier than or equal to the 'To' date.");
        setTrendRows(trend);
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

        const query = params.toString();
        const url = query ? `/api/analytics/charts?${query}` : "/api/analytics/charts";
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load analytics data.");
        }

        const payload = (await response.json()) as {
          trend?: Array<{ date: string; count: number }>;
        };

        if (!active) {
          return;
        }

        setTrendRows(payload.trend ?? []);
      } catch {
        if (!active) {
          return;
        }
        setErrorMessage("Unable to load filtered analytics. Showing latest available data.");
        setTrendRows(trend);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFilteredTrend();

    return () => {
      active = false;
    };
  }, [selectedForm, fromDate, toDate, trend]);

  // Calculate date range in days to determine view type
  const dayCount = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  // Prepare chart data based on range
  const { chartData, displayLabels } = useMemo(() => {
    if (dayCount && dayCount > 7) {
      // Weekly grouping
      const weekMap = new Map<string, number>();
      for (const row of trendRows) {
        const date = new Date(row.date);
        const weekStart = getISOWeekStart(date);
        const weekEnd = getWeekEndDate(weekStart);
        const weekKey = formatDateForInput(weekStart);
        weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + row.count);
      }

      const weekEntries = Array.from(weekMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([weekStart, count]) => {
          const weekEnd = getWeekEndDate(new Date(weekStart));
          return {
            label: getWeekLabel(new Date(weekStart), weekEnd),
            count,
          };
        });

      return {
        chartData: {
          labels: weekEntries.map((w) => w.label),
          datasets: [
            {
              label: "Submissions",
              data: weekEntries.map((w) => w.count),
              backgroundColor: chartPalette.primary,
              borderRadius: 6,
            },
          ],
        },
        displayLabels: weekEntries.map((w) => w.label),
      };
    } else {
      // Daily view - always show 7 days of the week
      let weekStart: Date;
      if (fromDate && toDate) {
        weekStart = new Date(fromDate);
      } else {
        const today = new Date();
        weekStart = getISOWeekStart(today);
      }

      const dailyData: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().slice(0, 10);
        dailyData[dateKey] = 0;
      }

      for (const row of trendRows) {
        const dateKey = row.date;
        if (dateKey in dailyData) {
          dailyData[dateKey] = row.count;
        }
      }

      const dailyEntries = Object.entries(dailyData).map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count,
      }));

      return {
        chartData: {
          labels: dailyEntries.map((e) => getDayLabel(e.date)),
          datasets: [
            {
              label: "Submissions",
              data: dailyEntries.map((e) => e.count),
              backgroundColor: chartPalette.primary,
              borderRadius: 6,
            },
          ],
        },
        displayLabels: dailyEntries.map((e) => getDayLabel(e.date)),
      };
    }
  }, [trendRows, dayCount, chartPalette]);

  // Update chart title based on date range
  useEffect(() => {
    if (!fromDate && !toDate) {
      const today = new Date();
      const weekStart = getISOWeekStart(today);
      const weekEnd = getWeekEndDate(weekStart);
      setChartTitle(`Submissions — Week of ${getWeekLabel(weekStart, weekEnd)}`);
    } else if (fromDate && toDate) {
      if (dayCount && dayCount <= 7) {
        setChartTitle(`Submissions — ${fromDate} to ${toDate}`);
      } else {
        setChartTitle(`Submissions — ${fromDate} to ${toDate}`);
      }
    }
  }, [fromDate, toDate, dayCount]);

  const handlePreviousWeek = () => {
    if (!fromDate && !toDate) {
      const today = new Date();
      const weekStart = getISOWeekStart(today);
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = getWeekEndDate(prevWeekStart);

      setFromDate(formatDateForInput(prevWeekStart));
      setToDate(formatDateForInput(prevWeekEnd));
    } else if (fromDate && toDate) {
      const currentStart = new Date(fromDate);
      const prevWeekStart = new Date(currentStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(prevWeekStart);
      prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);

      setFromDate(formatDateForInput(prevWeekStart));
      setToDate(formatDateForInput(prevWeekEnd));
    }
  };

  const handleNextWeek = () => {
    if (!fromDate && !toDate) {
      const today = new Date();
      const weekStart = getISOWeekStart(today);
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = getWeekEndDate(nextWeekStart);

      setFromDate(formatDateForInput(nextWeekStart));
      setToDate(formatDateForInput(nextWeekEnd));
    } else if (fromDate && toDate) {
      const currentStart = new Date(fromDate);
      const nextWeekStart = new Date(currentStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

      setFromDate(formatDateForInput(nextWeekStart));
      setToDate(formatDateForInput(nextWeekEnd));
    }
  };

  const hasTrendData = trendRows.some((row) => row.count > 0);

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
    return params;
  }, [selectedForm, fromDate, toDate]);

  function exportHref(mode: "summary", format: "excel" | "pdf"): string {
    const params = new URLSearchParams(exportBaseQuery);
    params.set("mode", mode);
    params.set("format", format);
    return `/api/exports/report?${params.toString()}`;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-surface p-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="form-filter" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Form
              </label>
              <select
                id="form-filter"
                value={selectedForm}
                onChange={(event) => setSelectedForm(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-default"
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
              <label htmlFor="from-date" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                From
              </label>
              <input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-default"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="to-date" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                To
              </label>
              <input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-default"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedForm("all");
                setFromDate("");
                setToDate("");
              }}
              className="rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-text-default hover:bg-surface-soft"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="rounded-xl border border-border p-2 text-text-default hover:bg-surface-soft"
              title="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextWeek}
              className="rounded-xl border border-border p-2 text-text-default hover:bg-surface-soft"
              title="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? <p className="text-xs text-text-muted">Loading analytics...</p> : null}
        {errorMessage ? <p className="text-xs text-error">{errorMessage}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-soft p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-default">{chartTitle}</h2>
          {hasTrendData ? (
            <div className="h-72">
              <Bar
                data={chartData}
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
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
              No submissions found for the current filters.
            </p>
          )}
        </div>

        {perFormSubmissions && perFormSubmissions.length > 0 ? (
          <div className="rounded-2xl border border-border bg-surface-soft p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-default">Submissions by Form</h2>
            <div className="h-72">
              <Bar
                data={{
                  labels: perFormSubmissions.map((f) => f.title),
                  datasets: [
                    {
                      label: "Submissions",
                      data: perFormSubmissions.map((f) => f.submissions),
                      backgroundColor: chartPalette.primary,
                      borderRadius: 6,
                    },
                  ],
                }}
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
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface-soft p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-default">Submissions by Form</h2>
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
              No form data available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
