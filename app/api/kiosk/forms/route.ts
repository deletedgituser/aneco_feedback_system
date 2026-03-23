import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const forms = await prisma.form.findMany({
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

  return NextResponse.json({ forms });
}
