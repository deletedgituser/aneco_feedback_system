import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalSubmissions, averageRating, totalForms] = await Promise.all([
    prisma.feedback.count(),
    prisma.response.aggregate({
      _avg: { answerValue: true },
    }),
    prisma.form.count({
      where: { isActive: true },
    }),
  ]);

  return NextResponse.json({
    totalSubmissions,
    averageRating: Number(averageRating._avg.answerValue ?? 0).toFixed(2),
    totalForms,
  });
}
