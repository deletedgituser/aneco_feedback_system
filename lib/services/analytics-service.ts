import { prisma } from "@/lib/prisma";

export interface AnalyticsChartFilters {
  formId?: number;
  assistedEmployee?: string;
  from?: Date;
  to?: Date;
}

export async function getAnalyticsSummary() {
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

export async function getAnalyticsCharts(filters: AnalyticsChartFilters) {
  const feedbackWhere = {
    ...(filters.formId ? { formId: filters.formId } : {}),
    ...(filters.assistedEmployee ? { assistedEmployee: filters.assistedEmployee } : {}),
    ...(filters.from || filters.to
      ? {
          submittedAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const feedbackRows = await prisma.feedback.findMany({
    where: feedbackWhere,
    select: {
      feedbackId: true,
      formId: true,
      submittedAt: true,
    },
    orderBy: {
      submittedAt: "asc",
    },
  });

  const feedbackIds = feedbackRows.map((row) => row.feedbackId);

  const responseRows = feedbackIds.length
    ? await prisma.response.findMany({
        where: {
          feedbackId: {
            in: feedbackIds,
          },
        },
        select: {
          responseId: true,
          feedbackId: true,
          answerValue: true,
          question: {
            select: {
              questionId: true,
              label: true,
            },
          },
        },
      })
    : [];

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

  const forms = await prisma.form.findMany({
    where: filters.formId ? { formId: filters.formId } : undefined,
    select: {
      formId: true,
      title: true,
    },
  });

  const perFormMap = new Map<number, { totalResponses: number; sum: number }>();
  for (const row of responseRows) {
    if (row.answerValue === null) {
      continue;
    }

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
    .sort((a, b) => b.averageRating - a.averageRating);

  const perQuestionMap = new Map<number, { label: string; totalResponses: number; sum: number }>();
  for (const row of responseRows) {
    if (row.answerValue === null) {
      continue;
    }

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
    totalFeedback: feedbackRows.length,
    totalResponses: responseRows.length,
    distribution,
    trend,
    perForm,
    perQuestion,
  };
}
