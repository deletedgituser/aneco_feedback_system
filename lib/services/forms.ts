import { prisma } from "@/lib/prisma";

export async function deleteFormWithDependents(formId: number) {
  return prisma.$transaction(async (tx) => {
    const form = await tx.form.findUnique({
      where: { formId },
      select: { formId: true },
    });

    if (!form) {
      return { deleted: false, responseCount: 0, feedbackCount: 0, questionCount: 0 };
    }

    const [responseCount, feedbackCount, questionCount] = await Promise.all([
      tx.response.count({ where: { feedback: { formId } } }),
      tx.feedback.count({ where: { formId } }),
      tx.question.count({ where: { formId } }),
    ]);

    await tx.response.deleteMany({
      where: {
        OR: [{ feedback: { formId } }, { question: { formId } }],
      },
    });
    await tx.feedback.deleteMany({ where: { formId } });
    await tx.question.deleteMany({ where: { formId } });
    await tx.form.delete({ where: { formId } });

    return { deleted: true, responseCount, feedbackCount, questionCount };
  });
}
