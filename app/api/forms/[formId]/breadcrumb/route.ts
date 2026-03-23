import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ formId: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { formId: formIdParam } = await params;
  const formId = Number(formIdParam);

  if (!Number.isInteger(formId) || formId <= 0) {
    return NextResponse.json({ message: "Invalid form id." }, { status: 400 });
  }

  const form = await prisma.form.findUnique({
    where: { formId },
    select: { title: true },
  });

  if (!form) {
    return NextResponse.json({ message: "Form not found." }, { status: 404 });
  }

  return NextResponse.json({ title: form.title });
}