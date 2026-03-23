import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import Link from "next/link";

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
    take: 12,
  });

  const feedbackToForm = new Map<number, number>();
  for (const row of feedbackRows) {
    feedbackToForm.set(row.feedbackId, row.formId);
  }

  const formTitleById = new Map<number, string>(forms.map((form) => [form.formId, form.title]));

  const perFormMap = new Map<number, { title: string; totalResponses: number; sum: number }>();
  for (const row of responseRows) {
    const formIdOfFeedback = feedbackToForm.get(row.feedbackId);
    if (!formIdOfFeedback) {
      continue;
    }
    const current = perFormMap.get(formIdOfFeedback) ?? {
      title: formTitleById.get(formIdOfFeedback) ?? `Form #${formIdOfFeedback}`,
      totalResponses: 0,
      sum: 0,
    };
    current.totalResponses += 1;
    current.sum += row.answerValue;
    perFormMap.set(formIdOfFeedback, current);
  }

  const perForm = Array.from(perFormMap.entries())
    .map(([formIdOfFeedback, value]) => ({
      formId: formIdOfFeedback,
      title: value.title,
      totalResponses: value.totalResponses,
      averageRating: Number((value.sum / value.totalResponses).toFixed(2)),
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10);

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Analytics Snapshot</h1>
        <Link
          href="/forms"
          className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Manage Forms
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total submissions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalSubmissions}</p>
        </article>
        <article className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Average rating</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.averageRating}</p>
        </article>
        <article className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Active forms</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalForms}</p>
        </article>
      </div>

      <AnalyticsCharts
        forms={chartData.forms}
        distribution={chartData.distribution}
        trend={chartData.trend}
        perForm={chartData.perForm}
        perQuestion={chartData.perQuestion}
      />

      <section className="rounded-lg border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Personnel Forms</h2>
          <Link href="/forms" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">
            Open forms page
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {chartData.forms.map((form: { formId: number; title: string; isActive: boolean }) => (
            <article key={form.formId} className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-800">{form.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {form.isActive ? "Active" : "Inactive"}
                </span>
                <Link href={`/forms/${form.formId}`} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                  Edit
                </Link>
              </div>
            </article>
          ))}
          {chartData.forms.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No forms yet. Create your first form in the forms page.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
