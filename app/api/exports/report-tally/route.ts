import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";
import {
  describeActiveFilters,
  getFormResponseReport,
  parseResponseFilters,
  type FormResponseReport,
  type TallyRow,
} from "@/lib/services/response-report";

export const runtime = "nodejs";

const PAGE_SIZE: [number, number] = [841.89, 595.28];
const MARGIN = 36;

async function requireDashboardSession() {
  const payload = await getSessionPayload();
  if (!payload?.sid || (payload.role !== "personnel" && payload.role !== "admin")) {
    return null;
  }
  if (payload.role === "personnel" && !payload.personnelId) return null;
  if (payload.role === "admin" && !payload.adminId) return null;

  const active = await isSessionActive(payload.sid);
  return active ? payload : null;
}

async function getDownloaderLabel(session: NonNullable<Awaited<ReturnType<typeof requireDashboardSession>>>) {
  if (session.role === "admin" && session.adminId) {
    const admin = await prisma.admin.findUnique({
      where: { adminId: session.adminId },
      select: { username: true },
    });
    return `Admin ${admin?.username ?? "unknown"} (#${session.adminId})`;
  }

  if (session.role === "personnel" && session.personnelId) {
    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: session.personnelId },
      select: { name: true },
    });
    return `Personnel ${personnel?.name ?? "unknown"} (#${session.personnelId})`;
  }

  return "Unknown account";
}

function cleanSheetName(value: string): string {
  return value.replace(/[*?:/\\[\]]/g, " ").slice(0, 31).trim() || "Report";
}

function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-US");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text || "-").split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : ["-"];
}

function drawText(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = rgb(0.16, 0.16, 0.16)) {
  page.drawText(text, { x, y, font, size, color });
}

function drawSectionTitle(page: PDFPage, title: string, y: number, bold: PDFFont) {
  drawText(page, title, MARGIN, y, bold, 12, rgb(0.14, 0.29, 0.28));
  page.drawLine({
    start: { x: MARGIN, y: y - 6 },
    end: { x: PAGE_SIZE[0] - MARGIN, y: y - 6 },
    thickness: 1,
    color: rgb(0.82, 0.86, 0.84),
  });
}

function drawBarChart(page: PDFPage, report: FormResponseReport, x: number, y: number, width: number, height: number, font: PDFFont, bold: PDFFont) {
  drawText(page, "Rating Distribution", x, y, bold, 10);
  const chartY = y - height + 14;
  const maxCount = Math.max(1, ...report.ratingDistribution.map((row) => row.count));
  const barGap = 12;
  const barWidth = (width - barGap * 6) / 5;
  const axisY = chartY + 28;

  page.drawLine({ start: { x, y: axisY }, end: { x: x + width, y: axisY }, thickness: 0.8, color: rgb(0.55, 0.6, 0.58) });

  report.ratingDistribution.forEach((row, index) => {
    const barHeight = Math.max(2, (row.count / maxCount) * (height - 58));
    const barX = x + barGap + index * (barWidth + barGap);
    page.drawRectangle({
      x: barX,
      y: axisY,
      width: barWidth,
      height: barHeight,
      color: rgb(0.27, 0.49, 0.47),
    });
    drawText(page, String(row.count), barX + barWidth / 2 - 3, axisY + barHeight + 4, font, 8);
    drawText(page, String(row.score), barX + barWidth / 2 - 3, axisY - 14, font, 8);
  });
  drawText(page, "Score", x + width / 2 - 12, chartY, font, 8, rgb(0.35, 0.35, 0.35));
}

function drawPieChart(page: PDFPage, report: FormResponseReport, x: number, y: number, width: number, height: number, font: PDFFont, bold: PDFFont) {
  drawText(page, "Submission Sentiment", x, y, bold, 10);
  const total = Math.max(1, report.sentimentDistribution.reduce((sum, row) => sum + row.count, 0));
  const colors = {
    positive: rgb(0.32, 0.62, 0.36),
    neutral: rgb(0.88, 0.68, 0.25),
    negative: rgb(0.72, 0.27, 0.2),
  };
  const labels = { positive: "Positive", neutral: "Neutral", negative: "Negative" };
  const centerX = x + width / 2;
  const centerY = y - height / 2 + 6;
  const radius = Math.min(width, height - 44) / 2;
  let start = 0;

  for (const row of report.sentimentDistribution) {
    const angle = (row.count / total) * Math.PI * 2;
    if (row.count > 0) {
      const steps = Math.max(24, Math.ceil(angle / 0.025));
      for (let i = 0; i <= steps; i += 1) {
        const current = start + (angle * i) / steps;
        page.drawLine({
          start: { x: centerX, y: centerY },
          end: { x: centerX + Math.cos(current) * radius, y: centerY + Math.sin(current) * radius },
          thickness: 1.8,
          color: colors[row.sentiment],
        });
      }
    }
    start += angle;
  }

  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius,
    borderColor: rgb(1, 1, 1),
    borderWidth: 1,
  });

  let legendY = y - height + 20;
  for (const row of report.sentimentDistribution) {
    page.drawRectangle({ x, y: legendY, width: 8, height: 8, color: colors[row.sentiment] });
    drawText(page, `${labels[row.sentiment]}: ${row.count}`, x + 14, legendY, font, 8);
    legendY += 14;
  }
}

function rowTotal(row: TallyRow): number {
  return row.stronglyAgree + row.agree + row.neutral + row.disagree + row.stronglyDisagree + row.notAnswered;
}

function overallPercentage(row: TallyRow): string {
  const total = rowTotal(row);
  const answered = total - row.notAnswered;
  if (answered <= 0) return "0.00%";
  return `${(((row.stronglyAgree + row.agree + row.neutral) / answered) * 100).toFixed(2)}%`;
}

function tallyTotals(rows: TallyRow[]) {
  const totals = rows.reduce(
    (sum, row) => ({
      stronglyAgree: sum.stronglyAgree + row.stronglyAgree,
      agree: sum.agree + row.agree,
      neutral: sum.neutral + row.neutral,
      disagree: sum.disagree + row.disagree,
      stronglyDisagree: sum.stronglyDisagree + row.stronglyDisagree,
      notAnswered: sum.notAnswered + row.notAnswered,
    }),
    { stronglyAgree: 0, agree: 0, neutral: 0, disagree: 0, stronglyDisagree: 0, notAnswered: 0 },
  );
  const total = totals.stronglyAgree + totals.agree + totals.neutral + totals.disagree + totals.stronglyDisagree + totals.notAnswered;
  const answered = total - totals.notAnswered;
  const percentage = answered <= 0 ? "0.00%" : `${(((totals.stronglyAgree + totals.agree + totals.neutral) / answered) * 100).toFixed(2)}%`;
  return { ...totals, total, percentage };
}

function drawTallyTable(pageState: { page: PDFPage; y: number }, pdf: PDFDocument, report: FormResponseReport, font: PDFFont, bold: PDFFont) {
  const columns = [
    { title: "#", width: 28, align: "center" as const },
    { title: "Survey Question", width: 300, align: "left" as const },
    { title: "Strongly\nAgree", width: 60, align: "center" as const },
    { title: "Agree", width: 48, align: "center" as const },
    { title: "Neutral", width: 52, align: "center" as const },
    { title: "Disagree", width: 56, align: "center" as const },
    { title: "Strongly\nDisagree", width: 68, align: "center" as const },
    { title: "N/A", width: 42, align: "center" as const },
    { title: "Total\nResponses", width: 64, align: "center" as const },
    { title: "Overall\n(%)", width: 58, align: "center" as const },
  ];
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const startX = MARGIN;

  function addPage() {
    pageState.page = pdf.addPage(PAGE_SIZE);
    pageState.y = PAGE_SIZE[1] - MARGIN;
  }

  function drawHeader() {
    let x = startX;
    pageState.page.drawRectangle({
      x: startX,
      y: pageState.y - 34,
      width: tableWidth,
      height: 36,
      color: rgb(0.22, 0.38, 0.36),
    });

    for (const column of columns) {
      const lines = column.title.split("\n");
      let lineY = pageState.y - (lines.length > 1 ? 13 : 20);
      for (const line of lines) {
        const textWidth = bold.widthOfTextAtSize(line, 8);
        const textX = column.align === "center" ? x + column.width / 2 - textWidth / 2 : x + 5;
        drawText(pageState.page, line, textX, lineY, bold, 8, rgb(1, 1, 1));
        lineY -= 10;
      }
      x += column.width;
    }
    pageState.y -= 38;
  }

  drawHeader();

  report.tallyRows.forEach((row, index) => {
    const questionLines = wrapText(row.questionLabel, font, 8, columns[1].width - 10).slice(0, 4);
    const rowHeight = Math.max(24, questionLines.length * 10 + 12);

    if (pageState.y - rowHeight < MARGIN + 28) {
      addPage();
      drawHeader();
    }

    const fill = index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.97, 0.96);
    pageState.page.drawRectangle({
      x: startX,
      y: pageState.y - rowHeight + 2,
      width: tableWidth,
      height: rowHeight,
      color: fill,
      borderColor: rgb(0.86, 0.9, 0.88),
      borderWidth: 0.35,
    });

    const values = [
      String(index + 1),
      row.questionLabel,
      String(row.stronglyAgree),
      String(row.agree),
      String(row.neutral),
      String(row.disagree),
      String(row.stronglyDisagree),
      String(row.notAnswered),
      String(rowTotal(row)),
      overallPercentage(row),
    ];

    let x = startX;
    values.forEach((value, columnIndex) => {
      if (columnIndex === 1) {
        let lineY = pageState.y - 12;
        for (const line of questionLines) {
          drawText(pageState.page, line, x + 5, lineY, font, 8);
          lineY -= 10;
        }
      } else {
        const text = value;
        const size = columnIndex === 9 ? 8 : 9;
        const textWidth = (columnIndex === 9 ? bold : font).widthOfTextAtSize(text, size);
        const textX = x + columns[columnIndex].width / 2 - textWidth / 2;
        const color = columnIndex === 9 ? rgb(0.9, 0.32, 0.2) : rgb(0.08, 0.12, 0.12);
        drawText(pageState.page, text, textX, pageState.y - 15, columnIndex === 9 ? bold : font, size, color);
      }
      x += columns[columnIndex].width;
    });

    pageState.y -= rowHeight;
  });

  const totals = tallyTotals(report.tallyRows);
  if (pageState.y - 26 < MARGIN) {
    addPage();
    drawHeader();
  }

  pageState.page.drawRectangle({
    x: startX,
    y: pageState.y - 24,
    width: tableWidth,
    height: 26,
    color: rgb(0.22, 0.38, 0.36),
  });

  const totalValues = [
    "Total",
    "",
    String(totals.stronglyAgree),
    String(totals.agree),
    String(totals.neutral),
    String(totals.disagree),
    String(totals.stronglyDisagree),
    String(totals.notAnswered),
    String(totals.total),
    totals.percentage,
  ];
  let x = startX;
  totalValues.forEach((value, index) => {
    if (index === 0) {
      drawText(pageState.page, value, x + 5, pageState.y - 16, bold, 9, rgb(1, 1, 1));
    } else if (index > 1) {
      const textWidth = bold.widthOfTextAtSize(value, 9);
      drawText(pageState.page, value, x + columns[index].width / 2 - textWidth / 2, pageState.y - 16, bold, 9, rgb(1, 1, 1));
    }
    x += columns[index].width;
  });

  pageState.y -= 32;
}

async function renderPdf(report: FormResponseReport, downloadedBy: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage(PAGE_SIZE);
  let y = PAGE_SIZE[1] - MARGIN;

  drawText(page, "ANECO Feedback Analytics Report", MARGIN, y, bold, 18, rgb(0.12, 0.27, 0.26));
  y -= 24;
  drawText(page, `Form: ${report.form.title}`, MARGIN, y, bold, 11);
  drawText(page, `Generated: ${formatDateTime(new Date())}`, PAGE_SIZE[0] - MARGIN - 190, y, font, 9);
  y -= 18;
  drawText(page, `Active filters: ${describeActiveFilters(report.filters).join("; ")}`, MARGIN, y, font, 9, rgb(0.35, 0.35, 0.35));
  drawText(page, `Downloaded by: ${downloadedBy}`, PAGE_SIZE[0] - MARGIN - 190, y, font, 9, rgb(0.35, 0.35, 0.35));
  y -= 28;

  drawSectionTitle(page, "Summary", y, bold);
  y -= 24;
  const metrics = [
    ["Total submissions", report.totalSubmissions],
    ["Response items", report.totalResponseItems],
    ["Average rating", report.averageRating],
  ];
  metrics.forEach(([label, value], index) => {
    const boxX = MARGIN + index * 180;
    page.drawRectangle({ x: boxX, y: y - 34, width: 160, height: 44, color: rgb(0.95, 0.97, 0.96), borderColor: rgb(0.8, 0.84, 0.82), borderWidth: 0.5 });
    drawText(page, String(label), boxX + 10, y - 2, font, 8, rgb(0.38, 0.42, 0.4));
    drawText(page, String(value), boxX + 10, y - 23, bold, 16, rgb(0.12, 0.27, 0.26));
  });
  y -= 70;

  drawSectionTitle(page, "Charts", y, bold);
  y -= 20;
  drawBarChart(page, report, MARGIN, y, 500, 160, font, bold);
  drawPieChart(page, report, MARGIN + 535, y, 230, 160, font, bold);
  y -= 190;

  const tablePage = pdf.addPage(PAGE_SIZE);
  const pageState = { page: tablePage, y: PAGE_SIZE[1] - MARGIN };
  drawText(pageState.page, "ANECO Feedback Analytics Report", MARGIN, pageState.y, bold, 14, rgb(0.12, 0.27, 0.26));
  pageState.y -= 18;
  drawText(pageState.page, `Survey Response Tally | Form: ${report.form.title}`, MARGIN, pageState.y, bold, 10);
  drawText(pageState.page, `Filters: ${describeActiveFilters(report.filters).join("; ")}`, PAGE_SIZE[0] - MARGIN - 230, pageState.y, font, 8, rgb(0.35, 0.35, 0.35));
  pageState.y -= 24;
  drawSectionTitle(pageState.page, "Survey Response Tally", pageState.y, bold);
  pageState.y -= 22;
  drawTallyTable(pageState, pdf, report, font, bold);

  return pdf.save();
}

async function renderExcel(report: FormResponseReport, downloadedBy: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ANECO Feedback System";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(cleanSheetName("Survey Response Tally"), {
    views: [{ state: "frozen", ySplit: 9 }],
  });

  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "ANECO Feedback Analytics Report";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF264B49" } };
  sheet.getCell("A2").value = "Form";
  sheet.getCell("B2").value = report.form.title;
  sheet.getCell("A3").value = "Generated";
  sheet.getCell("B3").value = formatDateTime(new Date());
  sheet.getCell("A4").value = "Active filters";
  sheet.getCell("B4").value = describeActiveFilters(report.filters).join("; ");
  sheet.getCell("A5").value = "Downloaded by";
  sheet.getCell("B5").value = downloadedBy;
  sheet.getCell("A6").value = "Total submissions";
  sheet.getCell("B6").value = report.totalSubmissions;
  sheet.getCell("C6").value = "Response items";
  sheet.getCell("D6").value = report.totalResponseItems;
  sheet.getCell("E6").value = "Average rating";
  sheet.getCell("F6").value = Number(report.averageRating);

  const headers = [
    "#",
    "Survey Question",
    "Strongly Agree",
    "Agree",
    "Neutral",
    "Disagree",
    "Strongly Disagree",
    "N/A",
    "Total Responses",
    "Overall (%)",
  ];
  const headerRow = sheet.getRow(9);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3A5F5D" } };
  headerRow.alignment = { vertical: "middle", wrapText: true };

  report.tallyRows.forEach((row, index) => {
    sheet.addRow([
      index + 1,
      row.questionLabel,
      row.stronglyAgree,
      row.agree,
      row.neutral,
      row.disagree,
      row.stronglyDisagree,
      row.notAnswered,
      rowTotal(row),
      overallPercentage(row),
    ]);
  });

  const totals = tallyTotals(report.tallyRows);
  const totalRow = sheet.addRow([
    "Total",
    "",
    totals.stronglyAgree,
    totals.agree,
    totals.neutral,
    totals.disagree,
    totals.stronglyDisagree,
    totals.notAnswered,
    totals.total,
    totals.percentage,
  ]);
  totalRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3A5F5D" } };

  sheet.columns = [
    { width: 8 },
    { width: 62 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 18 },
    { width: 10 },
    { width: 16 },
    { width: 14 },
  ];

  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD5DEDB" } },
        left: { style: "thin", color: { argb: "FFD5DEDB" } },
        bottom: { style: "thin", color: { argb: "FFD5DEDB" } },
        right: { style: "thin", color: { argb: "FFD5DEDB" } },
      };
      cell.alignment = { vertical: "middle", wrapText: true, horizontal: rowNumber >= 8 && colNumber !== 2 ? "center" : "left" };
    });
  if (rowNumber < 9) row.font = { ...row.font, bold: rowNumber === 1 };
  });

  const summary = workbook.addWorksheet("Summary");
  summary.addRows([
    ["Metric", "Value"],
    ["Total submissions", report.totalSubmissions],
    ["Response items", report.totalResponseItems],
    ["Average rating", Number(report.averageRating)],
    [],
    ["Sentiment", "Submission Count"],
    ...report.sentimentDistribution.map((row) => [row.sentiment, row.count]),
    [],
    ["Question", "5", "4", "3", "2", "1", "N/A", "Total"],
    ...report.tallyRows.map((row) => [
      row.questionLabel,
      row.stronglyAgree,
      row.agree,
      row.neutral,
      row.disagree,
      row.stronglyDisagree,
      row.notAnswered,
      rowTotal(row),
    ]),
  ]);
  summary.columns = [{ width: 42 }, ...Array.from({ length: 7 }, () => ({ width: 14 }))];
  summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF264B49" } };
  summary.getRow(6).font = { bold: true };
  summary.getRow(11).font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function GET(request: NextRequest) {
  const session = await requireDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const formId = Number(searchParams.get("formId"));
  if (!Number.isInteger(formId) || formId <= 0) {
    return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
  }

  const report = await getFormResponseReport({
    formId,
    filters: parseResponseFilters({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      respondent: searchParams.get("respondent") ?? undefined,
      assistedEmployee: searchParams.get("assistedEmployee") ?? undefined,
    }),
  });
  if (!report) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const format = searchParams.get("format") === "excel" ? "excel" : "pdf";
  const timestamp = new Date().toISOString().slice(0, 10);
  const downloadedBy = await getDownloaderLabel(session);

  await logAuditEvent({
    actorRole: session.role,
    actorId: session.role === "admin" ? session.adminId : session.personnelId,
    actionType: "report.download",
    targetType: "form",
    targetId: formId,
    metadata: {
      format,
      formTitle: report.form.title,
      filters: describeActiveFilters(report.filters),
      downloadedBy,
    },
  });

  if (format === "excel") {
    const buffer = await renderExcel(report, downloadedBy);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="survey-response-report-${formId}-${timestamp}.xlsx"`,
      },
    });
  }

  const pdfBytes = await renderPdf(report, downloadedBy);
  return new NextResponse(Uint8Array.from(pdfBytes).buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="survey-response-report-${formId}-${timestamp}.pdf"`,
    },
  });
}
