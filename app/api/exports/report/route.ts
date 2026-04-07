import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";

export const runtime = "nodejs";

type ReportMode = "summary" | "detailed";
type ExportFormat = "excel" | "pdf";

type DetailedRow = {
  submittedAt: string;
  formTitle: string;
  userName: string;
  assistedEmployee: string;
  comments: string;
  question: string;
  rating: number;
};

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

async function requirePersonnelSession() {
  const payload = await getSessionPayload();
  if (!payload?.sid || payload.role !== "personnel" || !payload.personnelId) {
    return null;
  }

  const active = await isSessionActive(payload.sid);
  if (!active) {
    return null;
  }

  return payload;
}

function parseMode(searchParams: URLSearchParams): ReportMode {
  const mode = searchParams.get("mode");
  return mode === "detailed" ? "detailed" : "summary";
}

function parseFormat(searchParams: URLSearchParams): ExportFormat {
  const format = searchParams.get("format");
  return format === "pdf" ? "pdf" : "excel";
}

function bufferFromWorkbook(workbook: XLSX.WorkBook): Buffer {
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

async function renderPdf(contentRows: string[], title: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595.28, 841.89]);
  const margin = 40;
  let y = page.getHeight() - margin;

  page.drawText(title, {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 26;

  const lineHeight = 14;
  const maxWidth = page.getWidth() - margin * 2;

  for (const row of contentRows) {
    const words = row.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, 10);
      if (width > maxWidth && line) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }

        page.drawText(line, {
          x: margin,
          y,
          size: 10,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = page.getHeight() - margin;
      }

      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= lineHeight;
    }
  }

  return pdfDoc.save();
}

export async function GET(request: NextRequest) {
  const session = await requirePersonnelSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const mode = parseMode(searchParams);
  const format = parseFormat(searchParams);

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

  const detailedRows: DetailedRow[] = [];
  for (const feedback of feedbackRows) {
    for (const response of feedback.responses) {
      detailedRows.push({
        submittedAt: feedback.submittedAt.toISOString(),
        formTitle: feedback.form.title,
        userName: feedback.userName ?? "",
        assistedEmployee: feedback.assistedEmployee ?? "",
        comments: feedback.comments ?? "",
        question: response.question.label,
        rating: response.answerValue,
      });
    }
  }

  const totalSubmissions = feedbackRows.length;
  const totalResponses = detailedRows.length;
  const averageRating =
    totalResponses > 0
      ? Number((detailedRows.reduce((sum, row) => sum + row.rating, 0) / totalResponses).toFixed(2))
      : 0;

  const distribution = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: detailedRows.filter((row) => row.rating === score).length,
  }));

  const perFormMap = new Map<number, { title: string; totalResponses: number; sum: number }>();
  const perQuestionMap = new Map<number, { label: string; totalResponses: number; sum: number }>();

  for (const feedback of feedbackRows) {
    for (const response of feedback.responses) {
      const formCurrent = perFormMap.get(feedback.form.formId) ?? {
        title: feedback.form.title,
        totalResponses: 0,
        sum: 0,
      };
      formCurrent.totalResponses += 1;
      formCurrent.sum += response.answerValue;
      perFormMap.set(feedback.form.formId, formCurrent);

      const questionCurrent = perQuestionMap.get(response.question.questionId) ?? {
        label: response.question.label,
        totalResponses: 0,
        sum: 0,
      };
      questionCurrent.totalResponses += 1;
      questionCurrent.sum += response.answerValue;
      perQuestionMap.set(response.question.questionId, questionCurrent);
    }
  }

  const perForm = Array.from(perFormMap.entries()).map(([id, value]) => ({
    formId: id,
    title: value.title,
    totalResponses: value.totalResponses,
    averageRating: Number((value.sum / value.totalResponses).toFixed(2)),
  }));

  const perQuestion = Array.from(perQuestionMap.entries()).map(([id, value]) => ({
    questionId: id,
    label: value.label,
    totalResponses: value.totalResponses,
    averageRating: Number((value.sum / value.totalResponses).toFixed(2)),
  }));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (format === "excel") {
    const workbook = XLSX.utils.book_new();

    if (mode === "summary") {
      const summaryRows = [
        { metric: "Total submissions", value: totalSubmissions },
        { metric: "Total responses", value: totalResponses },
        { metric: "Average rating", value: averageRating },
      ];

      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "Summary");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(distribution), "Distribution");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(perForm), "Per Form");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(perQuestion), "Per Question");
    } else {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailedRows), "Detailed Raw");
    }

    const buffer = bufferFromWorkbook(workbook);
    const filename = `aneco-${mode}-report-${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  }

  const lines: string[] = [];
  if (mode === "summary") {
    lines.push(`Total submissions: ${totalSubmissions}`);
    lines.push(`Total responses: ${totalResponses}`);
    lines.push(`Average rating: ${averageRating}`);
    lines.push("");
    lines.push("Rating distribution:");
    for (const row of distribution) {
      lines.push(`- Score ${row.score}: ${row.count}`);
    }
    lines.push("");
    lines.push("Per-form performance:");
    for (const row of perForm) {
      lines.push(`- ${row.title}: avg ${row.averageRating} (${row.totalResponses} responses)`);
    }
    lines.push("");
    lines.push("Per-question performance:");
    for (const row of perQuestion) {
      lines.push(`- ${row.label}: avg ${row.averageRating} (${row.totalResponses} responses)`);
    }
  } else {
    lines.push("Detailed raw responses:");
    lines.push("");
    for (const row of detailedRows) {
      lines.push(
        `${row.submittedAt} | ${row.formTitle} | ${row.userName || "-"} | ${row.assistedEmployee || "-"} | ${row.comments || "-"} | ${row.question} | ${row.rating}`,
      );
    }
  }

  const pdfBytes = await renderPdf(lines, `ANECO ${mode === "summary" ? "Summary" : "Detailed"} Report`);
  const pdfFilename = `aneco-${mode}-report-${timestamp}.pdf`;
  const pdfBody = Uint8Array.from(pdfBytes).buffer;

  return new NextResponse(pdfBody, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${pdfFilename}\"`,
    },
  });
}
