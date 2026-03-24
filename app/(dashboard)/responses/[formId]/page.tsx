import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormResponseModalList } from "@/components/dashboard/form-response-modal-list";

type FormResponsesPageProps = {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{
    page?: string;
    from?: string;
    to?: string;
    respondent?: string;
    assistedEmployee?: string;
  }>;
};

const PAGE_SIZE = 10;

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function scoreLabel(score: number): string {
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

export default async function FormResponsesPage({ params, searchParams }: FormResponsesPageProps) {
  const { formId: formIdParam } = await params;
  const query = await searchParams;
  const formId = Number(formIdParam);

  if (!Number.isInteger(formId) || formId <= 0) {
    notFound();
  }

  const page = parsePage(query.page);
  const fromDateText = String(query.from ?? "").trim();
  const toDateText = String(query.to ?? "").trim();
  const respondent = String(query.respondent ?? "").trim();
  const assistedEmployee = String(query.assistedEmployee ?? "").trim();

  const fromDate = parseDate(fromDateText);
  const toDate = parseDate(toDateText);

  const form = await prisma.form.findUnique({
    where: { formId },
    select: {
      formId: true,
      title: true,
      description: true,
    },
  });

  if (!form) {
    notFound();
  }

  const feedbackWhere = {
    formId,
    ...(fromDate || toDate
      ? {
          submittedAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
    ...(respondent
      ? {
          userName: {
            contains: respondent,
          },
        }
      : {}),
    ...(assistedEmployee
      ? {
          assistedEmployee: {
            contains: assistedEmployee,
          },
        }
      : {}),
  };

  const totalSubmissions = await prisma.feedback.count({ where: feedbackWhere });
  const totalPages = Math.max(1, Math.ceil(totalSubmissions / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [feedbackRows, responseAggregate, questionRows, ratingOneCount, ratingTwoCount, ratingThreeCount, ratingFourCount, ratingFiveCount] = await Promise.all([
    prisma.feedback.findMany({
      where: feedbackWhere,
      orderBy: { submittedAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        feedbackId: true,
        userName: true,
        assistedEmployee: true,
        submittedAt: true,
        responses: {
          orderBy: {
            question: {
              displayOrder: "asc",
            },
          },
          select: {
            responseId: true,
            answerValue: true,
            question: {
              select: {
                label: true,
              },
            },
          },
        },
      },
    }),
    prisma.response.aggregate({
      where: {
        feedback: feedbackWhere,
      },
      _avg: { answerValue: true },
      _count: { _all: true },
    }),
    prisma.question.findMany({
      where: { formId },
      orderBy: { displayOrder: "asc" },
      select: {
        questionId: true,
        label: true,
        responses: {
          where: {
            feedback: feedbackWhere,
          },
          select: {
            answerValue: true,
          },
        },
      },
    }),
    prisma.response.count({ where: { answerValue: 1, feedback: feedbackWhere } }),
    prisma.response.count({ where: { answerValue: 2, feedback: feedbackWhere } }),
    prisma.response.count({ where: { answerValue: 3, feedback: feedbackWhere } }),
    prisma.response.count({ where: { answerValue: 4, feedback: feedbackWhere } }),
    prisma.response.count({ where: { answerValue: 5, feedback: feedbackWhere } }),
  ]);

  const submissions = feedbackRows.map((feedback) => ({
    feedbackId: feedback.feedbackId,
    userName: feedback.userName,
    assistedEmployee: feedback.assistedEmployee,
    submittedAt: feedback.submittedAt.toISOString(),
    responses: feedback.responses.map((response) => ({
      responseId: response.responseId,
      answerValue: response.answerValue,
      questionLabel: response.question.label,
    })),
  }));

  const questionAnalytics = questionRows.map((question) => {
    const totalResponsesForQuestion = question.responses.length;
    const totalScore = question.responses.reduce((sum, row) => sum + row.answerValue, 0);
    return {
      questionId: question.questionId,
      label: question.label,
      totalResponses: totalResponsesForQuestion,
      averageRating: totalResponsesForQuestion > 0 ? Number((totalScore / totalResponsesForQuestion).toFixed(2)) : 0,
    };
  });

  const averageRating = Number(responseAggregate._avg.answerValue ?? 0).toFixed(2);
  const totalResponseItems = responseAggregate._count._all;

  const ratingDistribution = [
    { score: 1, count: ratingOneCount },
    { score: 2, count: ratingTwoCount },
    { score: 3, count: ratingThreeCount },
    { score: 4, count: ratingFourCount },
    { score: 5, count: ratingFiveCount },
  ];

  function makePageHref(targetPage: number): string {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    if (fromDateText) {
      params.set("from", fromDateText);
    }
    if (toDateText) {
      params.set("to", toDateText);
    }
    if (respondent) {
      params.set("respondent", respondent);
    }
    if (assistedEmployee) {
      params.set("assistedEmployee", assistedEmployee);
    }
    return `/responses/${formId}?${params.toString()}`;
  }

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-border-default bg-surface-muted p-4">
        <h1 className="text-xl font-semibold text-text-default">{form.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{form.description ?? "No description"}</p>
        <div className="mt-3 inline-flex rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-default ring-1 ring-border-default">
          {totalSubmissions} matching submissions
        </div>
      </header>

      <section className="grid gap-3 rounded-xl border border-border-default bg-surface p-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-lg border border-border-default bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Total Submissions</p>
          <p className="mt-1 text-xl font-semibold text-text-default">{totalSubmissions}</p>
        </article>
        <article className="rounded-lg border border-border-default bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Average Rating</p>
          <p className="mt-1 text-xl font-semibold text-text-default">{averageRating}</p>
        </article>
        <article className="rounded-lg border border-border-default bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Response Items</p>
          <p className="mt-1 text-xl font-semibold text-text-default">{totalResponseItems}</p>
        </article>
        <article className="rounded-lg border border-border-default bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Latest Order</p>
          <p className="mt-1 text-xl font-semibold text-text-default">Newest First</p>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-xl border border-border-default bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-default">Rating Distribution</h2>
          <ul className="space-y-2">
            {ratingDistribution.map((row) => (
              <li key={row.score} className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2 text-sm">
                <span className="font-medium text-text-default">{scoreLabel(row.score)}</span>
                <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold text-text-default ring-1 ring-border-default">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-border-default bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-text-default">Per-Question Performance</h2>
          <div className="space-y-2">
            {questionAnalytics.map((question) => (
              <div key={question.questionId} className="rounded-md bg-surface-muted p-3">
                <p className="text-sm font-medium text-text-default">{question.label}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-surface px-2 py-1 font-semibold text-text-default ring-1 ring-border-default">
                    Avg: {question.averageRating.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-1 font-semibold text-text-default ring-1 ring-border-default">
                    Responses: {question.totalResponses}
                  </span>
                </div>
              </div>
            ))}
            {questionAnalytics.length === 0 ? (
              <p className="rounded-md border border-dashed border-border-default p-4 text-sm text-text-muted">
                No questions found for this form.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-border-default bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-default">Filters</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label htmlFor="from" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={fromDateText}
              className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="to" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={toDateText}
              className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="respondent" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Respondent
            </label>
            <input
              id="respondent"
              name="respondent"
              defaultValue={respondent}
              placeholder="Name"
              className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="assistedEmployee" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Assisted Employee
            </label>
            <input
              id="assistedEmployee"
              name="assistedEmployee"
              defaultValue={assistedEmployee}
              placeholder="Name"
              className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand-primary-strong px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
            >
              Apply
            </button>
            <a
              href={`/responses/${formId}`}
              className="rounded-md border border-border-default px-3 py-2 text-sm font-semibold text-text-default hover:bg-brand-secondary"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      {submissions.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-default">Submissions List</h2>
            <p className="text-xs text-text-muted">Showing latest submissions first</p>
          </div>

          <FormResponseModalList submissions={submissions} />

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default p-3">
            <p className="text-sm text-text-muted">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <a
                  href={makePageHref(currentPage - 1)}
                  className="rounded-md border border-border-default px-3 py-2 text-xs font-semibold text-text-default hover:bg-brand-secondary"
                >
                  Previous
                </a>
              ) : (
                <span className="rounded-md border border-border-default px-3 py-2 text-xs font-semibold text-text-muted opacity-60">Previous</span>
              )}
              {currentPage < totalPages ? (
                <a
                  href={makePageHref(currentPage + 1)}
                  className="rounded-md border border-border-default px-3 py-2 text-xs font-semibold text-text-default hover:bg-brand-secondary"
                >
                  Next
                </a>
              ) : (
                <span className="rounded-md border border-border-default px-3 py-2 text-xs font-semibold text-text-muted opacity-60">Next</span>
              )}
            </div>
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-border-default p-6 text-sm text-text-muted">
          No responses yet for this form.
        </p>
      )}
    </section>
  );
}
