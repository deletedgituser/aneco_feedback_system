import { prisma } from "@/lib/prisma";
import type { PerQuestionStat } from "@/types";

/**
 * Fetches per-question performance stats for a given form
 * Returns average, min, max rating per question
 */
export async function getPerQuestionStats(formId: number): Promise<PerQuestionStat[]> {
  // Fetch all questions for the form
  const questions = await prisma.question.findMany({
    where: { formId },
    orderBy: { displayOrder: "asc" },
  });

  // Fetch all responses for the form
  const responses = await prisma.response.findMany({
    where: {
      question: { formId },
    },
    select: {
      questionId: true,
      answerValue: true,
    },
  });

  // Aggregate per question
  const stats: PerQuestionStat[] = [];

  for (const question of questions) {
    const questionResponses = responses.filter((r) => r.questionId === question.questionId);

    if (questionResponses.length === 0) {
      stats.push({
        questionId: question.questionId,
        label: question.label,
        averageRating: 0,
        highestScore: 0,
        lowestScore: 0,
        totalResponses: 0,
      });
    } else {
      const scores = questionResponses.map((r) => r.answerValue);
      const total = scores.reduce((sum, score) => sum + score, 0);
      const averageRating = Number((total / scores.length).toFixed(2));
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);

      stats.push({
        questionId: question.questionId,
        label: question.label,
        averageRating,
        highestScore,
        lowestScore,
        totalResponses: scores.length,
      });
    }
  }

  return stats;
}
