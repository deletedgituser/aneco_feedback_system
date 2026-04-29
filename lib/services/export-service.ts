import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/types/api";

export interface ExportFilters {
  formId?: number;
  assistedEmployee?: string;
  from?: Date;
  to?: Date;
}

export async function getReportFeedbackRows(filters: ExportFilters) {
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

  return prisma.feedback.findMany({
    where: feedbackWhere,
    orderBy: { submittedAt: "asc" },
    select: {
      submittedAt: true,
      userName: true,
      assistedEmployee: true,
      comments: true,
      form: {
        select: {
          formId: true,
          title: true,
        },
      },
      responses: {
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
  });
}

export async function getTallyFormById(formId: number) {
  return prisma.form.findUnique({
    where: { formId },
    select: {
      formId: true,
      title: true,
    },
  });
}

export async function getActorDisplayName(payload: SessionPayload): Promise<string> {
  if (payload.role === "personnel" && payload.personnelId) {
    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: payload.personnelId },
      select: { name: true },
    });

    return personnel?.name ?? "Unknown User";
  }

  if (payload.role === "admin" && payload.adminId) {
    const admin = await prisma.admin.findUnique({
      where: { adminId: payload.adminId },
      select: { username: true },
    });

    return admin?.username ?? "Unknown User";
  }

  return "Unknown User";
}

export async function getTallyRows(formId: number) {
  const feedbackRows = await prisma.feedback.findMany({
    where: { formId },
    select: {
      feedbackId: true,
      submittedAt: true,
    },
  });

  const feedbackIds = feedbackRows.map((row) => row.feedbackId);

  const questionRows = await prisma.question.findMany({
    where: { formId },
    orderBy: { displayOrder: "asc" },
    select: {
      questionId: true,
      label: true,
    },
  });

  const allResponses = feedbackIds.length
    ? await prisma.response.findMany({
        where: {
          feedbackId: {
            in: feedbackIds,
          },
        },
        select: {
          questionId: true,
          answerValue: true,
        },
      })
    : [];

  return {
    feedbackRows,
    questionRows,
    allResponses,
  };
}
