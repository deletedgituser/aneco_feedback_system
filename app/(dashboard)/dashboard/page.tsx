import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import Link from "next/link";
import { ClipboardList, Star, Vote } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

async function getSummary() {
  const [totalSubmissions, averageRating, totalForms] = await Promise.all([
    prisma.feedback.count(),
    prisma.response.aggregate({
      _avg: { answerValue: true },
    }),
    prisma.form.count({
      where: { isActive: true },
    }),
  ]);

  return {
    totalSubmissions,
    averageRating: Number(averageRating._avg.answerValue ?? 0).toFixed(2),
    totalForms,
  };
}

async function getChartData() {
  const feedbackRows = await prisma.feedback.findMany({
    select: {
      feedbackId: true,
      formId: true,
      submittedAt: true,
    },
    orderBy: {
      submittedAt: "asc",
    },
  });

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

  const forms = await prisma.form.findMany({
    select: {
      formId: true,
      title: true,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const feedbackToForm = new Map<number, number>();
  for (const row of feedbackRows) {
    feedbackToForm.set(row.feedbackId, row.formId);
  }

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

  return {
    distribution,
    trend,
    forms,
    perForm,
    perQuestion,
  };
}

export default async function DashboardPage() {
  const summary = await getSummary();
  const chartData = await getChartData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text-default">Analytics Snapshot</h1>
        <Link
          href="/forms"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Manage Forms
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total submissions" value={summary.totalSubmissions} icon={Vote} />
        <StatCard label="Average rating" value={summary.averageRating} icon={Star} />
        <StatCard label="Active forms" value={summary.totalForms} icon={ClipboardList} />
      </div>

      <AnalyticsCharts
        forms={chartData.forms}
        distribution={chartData.distribution}
        trend={chartData.trend}
        perForm={chartData.perForm}
        perQuestion={chartData.perQuestion}
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
