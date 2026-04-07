import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { computeSentiment } from "@/lib/sentiment";
import { ResponsesPageTabs } from "@/components/responses/ResponsesPageTabs";

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
        comments: true,
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

  // Add sentiment calculation for each submission
  const submissions = feedbackRows.map((feedback) => {
    // Filter and convert answer values to numbers, excluding null/undefined
    const answerValues = feedback.responses
      .map((response) => response.answerValue)
      .filter((value) => value !== null && value !== undefined)
      .map((value) => Number(value));
    
    const sentimentResult = computeSentiment(answerValues);
    const sentiment = sentimentResult.sentiment;

    return {
      feedbackId: feedback.feedbackId,
      userName: feedback.userName,
      assistedEmployee: feedback.assistedEmployee,
      comments: feedback.comments,
      submittedAt: feedback.submittedAt.toISOString(),
      responses: feedback.responses.map((response) => ({
        responseId: response.responseId,
        answerValue: response.answerValue,
        questionLabel: response.question.label,
      })),
      sentiment, // Add sentiment to each submission
    };
  });

  const questionAnalytics = questionRows.map((question) => {
    const totalResponsesForQuestion = question.responses.length;
    const totalScore = question.responses.reduce((sum, row) => sum + row.answerValue, 0);
    const scores = question.responses.map((r) => r.answerValue);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    return {
      questionId: question.questionId,
      label: question.label,
      averageRating: totalResponsesForQuestion > 0 ? Number((totalScore / totalResponsesForQuestion).toFixed(2)) : 0,
      highestScore,
      lowestScore,
      totalResponses: totalResponsesForQuestion,
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

  const prevPageHref = currentPage > 1 ? makePageHref(currentPage - 1) : undefined;
  const nextPageHref = currentPage < totalPages ? makePageHref(currentPage + 1) : undefined;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/responses"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default transition-colors duration-150 hover:bg-surface-soft"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
      </div>
      <header className="rounded-2xl border border-border bg-surface-soft p-6">
        <h1 className="text-2xl font-semibold text-text-default">{form.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{form.description ?? "No description"}</p>
        <div className="mt-3 inline-flex rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-default ring-1 ring-border">
          {totalSubmissions} matching submissions
        </div>
      </header>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-border bg-surface-soft p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Total Submissions</p>
          <p className="mt-1 text-xl font-semibold text-text-default">{totalSubmissions}</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface-soft p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Average Rating</p>
          <p className="mt-1 text-xl font-semibold text-text-default">{averageRating}</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface-soft p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Response Items</p>
          <p className="mt-1 text-xl font-semibold text-text-default">{totalResponseItems}</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface-soft p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Latest Order</p>
          <p className="mt-1 text-xl font-semibold text-text-default">Newest First</p>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Apply
            </button>
            <a
              href={`/responses/${formId}`}
              className="rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-text-default hover:bg-surface-soft"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      {submissions.length > 0 ? (
        <ResponsesPageTabs submissions={submissions} stats={questionAnalytics} distribution={ratingDistribution} currentPage={currentPage} totalPages={totalPages} prevPageHref={prevPageHref} nextPageHref={nextPageHref} />
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
          No responses yet for this form.
        </p>
      )}
    </section>
  );
}
