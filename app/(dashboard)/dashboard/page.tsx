import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import Link from "next/link";
import { ClipboardList, Vote, MessageSquare } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { LiveRefresh } from "@/components/ui/live-refresh";

async function getSummary() {
  const [totalResponsesCount, totalFormsCount] = await Promise.all([
    prisma.feedback.count(),
    prisma.form.count({
      where: { isActive: true },
    }),
  ]);

  return {
    totalResponses: totalResponsesCount,
    totalForms: totalFormsCount,
  };
}

async function getChartData() {
  const [feedbackRows, forms, groupedFeedbackCounts] = await Promise.all([
    prisma.feedback.findMany({
      select: {
        feedbackId: true,
        formId: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: "asc",
      },
    }),
    prisma.form.findMany({
      select: {
        formId: true,
        title: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.groupBy({
      by: ["formId"],
      _count: {
        _all: true,
      },
    }),
  ]);

  const responseRows = await prisma.response.findMany({
    select: {
      feedbackId: true,
      answerValue: true,
      question: {
        select: {
          questionId: true,
          label: true,
        },
      },
    },
  });

  const distribution = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: responseRows.filter((row) => row.answerValue === score).length,
  }));

  const trendMap = new Map<string, number>();
  for (const row of feedbackRows) {
    const key = row.submittedAt.toISOString().slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }

  const trend = Array.from(trendMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const feedbackToForm = new Map<number, number>();
  for (const row of feedbackRows) {
    feedbackToForm.set(row.feedbackId, row.formId);
  }

  // Per-form submission counts from DB grouping to avoid client-side undercounting.
  const perFormSubmissionMap = new Map<number, number>();
  for (const row of groupedFeedbackCounts) {
    perFormSubmissionMap.set(row.formId, row._count._all);
  }

  const perFormSubmissions = forms
    .map((form) => ({
      formId: form.formId,
      title: form.title,
      submissions: perFormSubmissionMap.get(form.formId) ?? 0,
    }))
    .sort((a, b) => b.submissions - a.submissions);

  const perFormMap = new Map<number, { totalResponses: number; sum: number }>();
  for (const row of responseRows) {
    const formIdOfFeedback = feedbackToForm.get(row.feedbackId);
    if (!formIdOfFeedback) {
      continue;
    }
    const current = perFormMap.get(formIdOfFeedback) ?? {
      totalResponses: 0,
      sum: 0,
    };
    current.totalResponses += 1;
    current.sum += row.answerValue;
    perFormMap.set(formIdOfFeedback, current);
  }

  const perForm = forms
    .map((form) => {
      const aggregate = perFormMap.get(form.formId);
      const totalResponses = aggregate?.totalResponses ?? 0;
      const averageRating = totalResponses > 0 ? Number(((aggregate?.sum ?? 0) / totalResponses).toFixed(2)) : 0;

      return {
        formId: form.formId,
        title: form.title,
        totalResponses,
        averageRating,
      };
    })
    .sort((a, b) => b.averageRating - a.averageRating)
    ;

  const perQuestionMap = new Map<number, { label: string; totalResponses: number; sum: number }>();
  for (const row of responseRows) {
    const current = perQuestionMap.get(row.question.questionId) ?? {
      label: row.question.label,
      totalResponses: 0,
      sum: 0,
    };
    current.totalResponses += 1;
    current.sum += row.answerValue;
    perQuestionMap.set(row.question.questionId, current);
  }

  const perQuestion = Array.from(perQuestionMap.entries())
    .map(([questionId, value]) => ({
      questionId,
      label: value.label,
      totalResponses: value.totalResponses,
      averageRating: Number((value.sum / value.totalResponses).toFixed(2)),
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10);

  // Total questions count
  const totalQuestions = await prisma.question.count({
    where: {
      form: {
        isActive: true,
      },
    },
  });

  return {
    distribution,
    trend,
    forms,
    perForm,
    perQuestion,
    perFormSubmissions,
    totalQuestions,
  };
}

export default async function DashboardPage() {
  const summary = await getSummary();
  const chartData = await getChartData();

  return (
    <div className="space-y-6">
      <LiveRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Live Overview</p>
          <h1 className="text-2xl font-semibold text-text-default">Analytics Snapshot</h1>
        </div>
        <Link
          href="/forms"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Manage Forms
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard label="Total Forms" value={summary.totalForms} icon={ClipboardList} />
        <StatCard label="Total Responses" value={summary.totalResponses} icon={Vote} />
        <StatCard label="Total Questions" value={chartData.totalQuestions} icon={MessageSquare} />
      </div>

      <AnalyticsCharts
        forms={chartData.forms}
        distribution={chartData.distribution}
        trend={chartData.trend}
        perFormSubmissions={chartData.perFormSubmissions}
      />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-default">Personnel Forms</h2>
          <Link href="/forms" className="text-sm font-semibold text-primary hover:text-primary-hover">
            Open forms page
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chartData.forms.map((form: { formId: number; title: string; isActive: boolean }) => (
            <article key={form.formId} className="rounded-2xl border border-border bg-surface-soft p-4">
              <p className="text-sm font-semibold text-text-default">{form.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    form.isActive ? "bg-success/20 text-success" : "bg-danger/18 text-danger"
                  }`}
                >
                  {form.isActive ? "Active" : "Inactive"}
                </span>
                <Link href={`/forms/${form.formId}`} className="text-xs font-semibold text-text-default hover:text-primary">
                  Edit
                </Link>
              </div>
            </article>
          ))}
          {chartData.forms.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-text-muted">
              No forms yet. Create your first form in the forms page.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
