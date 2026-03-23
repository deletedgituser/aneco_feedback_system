import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toDateRange(searchParams: URLSearchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const parsedFrom = from ? new Date(from) : null;
  const parsedTo = to ? new Date(to) : null;

  return {
    from: parsedFrom && !Number.isNaN(parsedFrom.getTime()) ? parsedFrom : null,
    to: parsedTo && !Number.isNaN(parsedTo.getTime()) ? parsedTo : null,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const formId = Number(searchParams.get("formId"));
  const assistedEmployee = searchParams.get("assistedEmployee")?.trim();
  const { from, to } = toDateRange(searchParams);

  const feedbackWhere = {
    ...(Number.isInteger(formId) && formId > 0 ? { formId } : {}),
    ...(assistedEmployee ? { assistedEmployee } : {}),
    ...(from || to
      ? {
          submittedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
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
    where: Number.isInteger(formId) && formId > 0 ? { formId } : undefined,
    select: {
      formId: true,
      title: true,
    },
  });

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

  return NextResponse.json({
    totalFeedback: feedbackRows.length,
    totalResponses: responseRows.length,
    distribution,
    trend,
    perForm,
    perQuestion,
  });
}
