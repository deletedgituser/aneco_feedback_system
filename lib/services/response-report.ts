import { prisma } from "@/lib/prisma";
import { computeSentiment } from "@/lib/sentiment";
import type { PerQuestionStat, SentimentType } from "@/types";

export const RESPONSE_PAGE_SIZE = 10;

export type ResponseFiltersInput = {
  from?: string;
  to?: string;
  respondent?: string;
  assistedEmployee?: string;
};

export type ParsedResponseFilters = {
  fromDate: Date | null;
  toDate: Date | null;
  fromDateText: string;
  toDateText: string;
  respondent: string;
  assistedEmployee: string;
};

export type TallyRow = {
  questionId: number;
  questionLabel: string;
  stronglyAgree: number;
  agree: number;
  neutral: number;
  disagree: number;
  stronglyDisagree: number;
  notAnswered: number;
};

export type SentimentDistributionRow = {
  sentiment: SentimentType;
  count: number;
};

export type SubmissionItem = {
  feedbackId: number;
  userName: string | null;
  assistedEmployee: string | null;
  comments: string | null;
  submittedAt: string;
  sentiment: SentimentType;
  responses: Array<{
    responseId: number;
    answerValue: number | null;
    questionLabel: string;
  }>;
  allQuestions: Array<{
    questionId: number;
    label: string;
    answerValue: number | null;
  }>;
};

export type ExportResponseRow = {
  submittedAt: string;
  respondent: string;
  assistedEmployee: string;
  comments: string;
  sentiment: SentimentType;
  averageRating: number;
  answers: Record<string, number | string>;
};

export type FormResponseReport = {
  form: {
    formId: number;
    title: string;
    description: string | null;
  };
  filters: ParsedResponseFilters;
  submissions: SubmissionItem[];
  exportRows: ExportResponseRow[];
  questionStats: PerQuestionStat[];
  ratingDistribution: Array<{ score: number; count: number }>;
  sentimentDistribution: SentimentDistributionRow[];
  tallyRows: TallyRow[];
  totalSubmissions: number;
  totalPages: number;
  currentPage: number;
  averageRating: string;
  totalResponseItems: number;
};

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseResponseFilters(input: ResponseFiltersInput): ParsedResponseFilters {
  const fromDateText = String(input.from ?? "").trim();
  const toDateText = String(input.to ?? "").trim();

  return {
    fromDate: parseDate(fromDateText),
    toDate: parseDate(toDateText),
    fromDateText,
    toDateText,
    respondent: String(input.respondent ?? "").trim(),
    assistedEmployee: String(input.assistedEmployee ?? "").trim(),
  };
}

export function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function buildFeedbackWhere(formId: number, filters: ParsedResponseFilters) {
  return {
    formId,
    ...(filters.fromDate || filters.toDate
      ? {
          submittedAt: {
            ...(filters.fromDate ? { gte: filters.fromDate } : {}),
            ...(filters.toDate ? { lte: filters.toDate } : {}),
          },
        }
      : {}),
    ...(filters.respondent
      ? {
          userName: {
            contains: filters.respondent,
          },
        }
      : {}),
    ...(filters.assistedEmployee
      ? {
          assistedEmployee: {
            contains: filters.assistedEmployee,
          },
        }
      : {}),
  };
}

export function buildResponseFilterSearchParams(filters: ParsedResponseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.fromDateText) params.set("from", filters.fromDateText);
  if (filters.toDateText) params.set("to", filters.toDateText);
  if (filters.respondent) params.set("respondent", filters.respondent);
  if (filters.assistedEmployee) params.set("assistedEmployee", filters.assistedEmployee);
  return params;
}

export function describeActiveFilters(filters: ParsedResponseFilters): string[] {
  const rows: string[] = [];
  if (filters.fromDateText) rows.push(`From: ${filters.fromDateText}`);
  if (filters.toDateText) rows.push(`To: ${filters.toDateText}`);
  if (filters.respondent) rows.push(`Respondent: ${filters.respondent}`);
  if (filters.assistedEmployee) rows.push(`Assisted employee: ${filters.assistedEmployee}`);
  return rows.length > 0 ? rows : ["None"];
}

function buildTallyRows(
  questions: Array<{ questionId: number; label: string }>,
  responseRows: Array<{ questionId: number; answerValue: number | null }>,
  totalSubmissions: number,
): TallyRow[] {
  const tallyMap = new Map<number, TallyRow>();

  for (const question of questions) {
    tallyMap.set(question.questionId, {
      questionId: question.questionId,
      questionLabel: question.label,
      stronglyAgree: 0,
      agree: 0,
      neutral: 0,
      disagree: 0,
      stronglyDisagree: 0,
      notAnswered: 0,
    });
  }

  for (const response of responseRows) {
    const tally = tallyMap.get(response.questionId);
    if (!tally) continue;

    if (response.answerValue === 5) tally.stronglyAgree += 1;
    else if (response.answerValue === 4) tally.agree += 1;
    else if (response.answerValue === 3) tally.neutral += 1;
    else if (response.answerValue === 2) tally.disagree += 1;
    else if (response.answerValue === 1) tally.stronglyDisagree += 1;
  }

  for (const question of questions) {
    const tally = tallyMap.get(question.questionId);
    if (!tally) continue;
    const responseCountForQuestion = responseRows.filter((row) => row.questionId === question.questionId).length;
    tally.notAnswered = Math.max(0, totalSubmissions - responseCountForQuestion);
  }

  return Array.from(tallyMap.values());
}

export async function getFormResponseReport({
  formId,
  page = 1,
  filters,
  pageSize = RESPONSE_PAGE_SIZE,
}: {
  formId: number;
  page?: number;
  filters: ParsedResponseFilters;
  pageSize?: number;
}): Promise<FormResponseReport | null> {
  const form = await prisma.form.findUnique({
    where: { formId },
    select: {
      formId: true,
      title: true,
      description: true,
    },
  });

  if (!form) {
    return null;
  }

  const feedbackWhere = buildFeedbackWhere(formId, filters);
  const totalSubmissions = await prisma.feedback.count({ where: feedbackWhere });
  const totalPages = Math.max(1, Math.ceil(totalSubmissions / pageSize));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const [pagedFeedbackRows, allFeedbackRows, responseAggregate, questionRows, ratingCounts, allResponses] =
    await Promise.all([
      prisma.feedback.findMany({
        where: feedbackWhere,
        orderBy: { submittedAt: "desc" },
        skip,
        take: pageSize,
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
                  questionId: true,
                  label: true,
                },
              },
            },
          },
        },
      }),
      prisma.feedback.findMany({
        where: feedbackWhere,
        orderBy: { submittedAt: "desc" },
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
              answerValue: true,
              question: {
                select: {
                  questionId: true,
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
      Promise.all(
        [1, 2, 3, 4, 5].map((score) =>
          prisma.response.count({
            where: {
              answerValue: score,
              feedback: feedbackWhere,
            },
          }),
        ),
      ),
      prisma.response.findMany({
        where: {
          feedback: feedbackWhere,
        },
        select: {
          questionId: true,
          answerValue: true,
        },
      }),
    ]);

  const questionSummaries = questionRows.map((question) => ({
    questionId: question.questionId,
    label: question.label,
  }));

  const toSubmission = (feedback: (typeof pagedFeedbackRows)[number]): SubmissionItem => {
    const answerValues = feedback.responses
      .map((response) => response.answerValue)
      .filter((value): value is number => value !== null && value !== undefined);
    const sentiment = computeSentiment(answerValues).sentiment;
    const answeredMap = new Map(feedback.responses.map((response) => [response.question.questionId, response]));

    return {
      feedbackId: feedback.feedbackId,
      userName: feedback.userName,
      assistedEmployee: feedback.assistedEmployee,
      comments: feedback.comments,
      submittedAt: feedback.submittedAt.toISOString(),
      sentiment,
      responses: feedback.responses.map((response) => ({
        responseId: "responseId" in response ? response.responseId : 0,
        answerValue: response.answerValue,
        questionLabel: response.question.label,
      })),
      allQuestions: questionSummaries.map((question) => ({
        questionId: question.questionId,
        label: question.label,
        answerValue: answeredMap.get(question.questionId)?.answerValue ?? null,
      })),
    };
  };

  const submissions = pagedFeedbackRows.map(toSubmission);
  const allSubmissionsForSentiment = allFeedbackRows.map((feedback) => {
    const values = feedback.responses
      .map((response) => response.answerValue)
      .filter((value): value is number => value !== null && value !== undefined);
    return computeSentiment(values).sentiment;
  });

  const sentimentDistribution: SentimentDistributionRow[] = [
    { sentiment: "positive", count: allSubmissionsForSentiment.filter((sentiment) => sentiment === "positive").length },
    { sentiment: "neutral", count: allSubmissionsForSentiment.filter((sentiment) => sentiment === "neutral").length },
    { sentiment: "negative", count: allSubmissionsForSentiment.filter((sentiment) => sentiment === "negative").length },
  ];

  const questionStats = questionRows.map((question) => {
    const scores = question.responses
      .map((response) => response.answerValue)
      .filter((value): value is number => value !== null && value !== undefined);
    const totalScore = scores.reduce((sum, value) => sum + value, 0);

    return {
      questionId: question.questionId,
      label: question.label,
      averageRating: scores.length > 0 ? Number((totalScore / scores.length).toFixed(2)) : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      totalResponses: scores.length,
    };
  });

  const exportRows: ExportResponseRow[] = allFeedbackRows.map((feedback) => {
    const answerValues = feedback.responses
      .map((response) => response.answerValue)
      .filter((value): value is number => value !== null && value !== undefined);
    const sentimentResult = computeSentiment(answerValues);
    const answers = new Map(feedback.responses.map((response) => [response.question.questionId, response.answerValue]));

    return {
      submittedAt: feedback.submittedAt.toISOString(),
      respondent: feedback.userName?.trim() || "Anonymous",
      assistedEmployee: feedback.assistedEmployee?.trim() || "Not specified",
      comments: feedback.comments?.trim() || "No comments",
      sentiment: sentimentResult.sentiment,
      averageRating: sentimentResult.averageRating,
      answers: Object.fromEntries(
        questionSummaries.map((question) => [question.label, answers.get(question.questionId) ?? "N/A"]),
      ),
    };
  });

  return {
    form,
    filters,
    submissions,
    exportRows,
    questionStats,
    ratingDistribution: [1, 2, 3, 4, 5].map((score, index) => ({ score, count: ratingCounts[index] })),
    sentimentDistribution,
    tallyRows: buildTallyRows(questionSummaries, allResponses, totalSubmissions),
    totalSubmissions,
    totalPages,
    currentPage,
    averageRating: Number(responseAggregate._avg.answerValue ?? 0).toFixed(2),
    totalResponseItems: responseAggregate._count._all,
  };
}
