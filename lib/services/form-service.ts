import { prisma } from "@/lib/prisma";

export async function getActiveKioskForms() {
  return prisma.form.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      formId: true,
      title: true,
      description: true,
      language: true,
      createdAt: true,
    },
  });
}

export async function getFormTitleById(formId: number): Promise<string | null> {
  const form = await prisma.form.findUnique({
    where: { formId },
    select: { title: true },
  });

  return form?.title ?? null;
}
