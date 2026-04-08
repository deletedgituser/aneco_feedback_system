import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";

export const runtime = "nodejs";

// Helper function to wrap text into multiple lines for table cells
function wrapTextLines(text: string, maxCharsPerLine: number = 18): string[] {
  if (text.length <= maxCharsPerLine) {
    return [text];
  }
  
  const lines: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxCharsPerLine) {
      lines.push(remaining);
      break;
    }
    
    // Try to break at a word boundary
    let breakPoint = maxCharsPerLine;
    const lastSpace = remaining.lastIndexOf(' ', maxCharsPerLine);
    if (lastSpace > 0) {
      breakPoint = lastSpace;
    }
    
    lines.push(remaining.substring(0, breakPoint).trim());
    remaining = remaining.substring(breakPoint).trim();
  }
  
  return lines;
}

async function requirePersonnelSession() {
  const payload = await getSessionPayload();
  // FIX: Allow both personnel and admin roles to export reports
  if (!payload?.sid || (payload.role !== "personnel" && payload.role !== "admin")) {
    return null;
  }
  if (payload.role === "personnel" && !payload.personnelId) {
    return null;
  }
  if (payload.role === "admin" && !payload.adminId) {
    return null;
  }

  const active = await isSessionActive(payload.sid);
  if (!active) {
    return null;
  }

  return payload;
}

export async function GET(request: NextRequest) {
  const sessionPayload = await requirePersonnelSession();
  if (!sessionPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const formId = Number(searchParams.get("formId"));

  if (!Number.isInteger(formId) || formId <= 0) {
    return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
  }

  // Fetch form data
  const form = await prisma.form.findUnique({
    where: { formId },
    select: {
      formId: true,
      title: true,
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  // Fetch personnel or admin name based on role
  let userName = "Unknown User";
  if (sessionPayload.role === "personnel" && sessionPayload.personnelId) {
    const personnel = await prisma.personnel.findUnique({
      where: { personnelId: sessionPayload.personnelId },
      select: { name: true },
    });
    if (personnel) {
      userName = personnel.name;
    }
  } else if (sessionPayload.role === "admin" && sessionPayload.adminId) {
    const admin = await prisma.admin.findUnique({
      where: { adminId: sessionPayload.adminId },
      select: { username: true },
    });
    if (admin) {
      userName = admin.username;
    }
  }

  // Fetch all responses and feedback for the form
  const feedbackRows = await prisma.feedback.findMany({
    where: { formId },
    select: {
      feedbackId: true,
      submittedAt: true,
    },
  });

  const feedbackIds = feedbackRows.map((row) => row.feedbackId);
  const totalResponses = feedbackRows.length;

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

  // Build tally data
  const tallyMap = new Map<
    number,
    {
      questionLabel: string;
      stronglyAgree: number;
      agree: number;
      neutral: number;
      disagree: number;
      stronglyDisagree: number;
      notAnswered: number;
    }
  >();

  for (const question of questionRows) {
    tallyMap.set(question.questionId, {
      questionLabel: question.label,
      stronglyAgree: 0,
      agree: 0,
      neutral: 0,
      disagree: 0,
      stronglyDisagree: 0,
      notAnswered: 0,
    });
  }

  // Count responses
  for (const response of allResponses) {
    const tally = tallyMap.get(response.questionId);
    if (!tally) continue;

    if (response.answerValue === null) {
      tally.notAnswered++;
    } else if (response.answerValue === 5) {
      tally.stronglyAgree++;
    } else if (response.answerValue === 4) {
      tally.agree++;
    } else if (response.answerValue === 3) {
      tally.neutral++;
    } else if (response.answerValue === 2) {
      tally.disagree++;
    } else if (response.answerValue === 1) {
      tally.stronglyDisagree++;
    }
  }

  // Count N/A for each question
  for (const question of questionRows) {
    const tally = tallyMap.get(question.questionId);
    if (!tally) continue;
    const responseCount = allResponses.filter((r) => r.questionId === question.questionId).length;
    tally.notAnswered = totalResponses - responseCount;
  }

  // Generate PDF
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 842.51]); // Portrait A4
    const margin = 35;
    const pageWidth = page.getWidth();
    let y = page.getHeight() - margin;

    // Title - centered (FIX: use actual text width for proper centering)
    const titleText = "ANECO FEEDBACK SYSTEM";
    const titleWidth = boldFont.widthOfTextAtSize(titleText, 16);
    const titleX = (pageWidth - titleWidth) / 2;
    page.drawText(titleText, {
      x: titleX,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.4),
    });
    y -= 22;

    const subtitleText = "Personnel Performance Report";
    const subtitleWidth = boldFont.widthOfTextAtSize(subtitleText, 14);
    const subtitleX = (pageWidth - subtitleWidth) / 2;
    page.drawText(subtitleText, {
      x: subtitleX,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 24;

    // Header info
    const now = new Date();
    const headerInfo = [
      `Form: ${form.title}`,
      `Personnel: ${userName}`,
      `Total Respondents: ${totalResponses}`,
      `Generated: ${now.toLocaleString()}`,
    ];

    for (const info of headerInfo) {
      page.drawText(info, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 14;
    }

    y -= 10; // FIX: Reduced excessive spacing

    // Table - adjusted for portrait mode with much wider question column
    const colWidths = [22, 250, 30, 30, 30, 30, 30, 20, 50, 50];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = margin;
    let x = startX;

    // Check if we need a new page
    if (y < 250) {
      page = pdfDoc.addPage([595.28, 842.51]);
      y = page.getHeight() - margin;
    }

    // Header row
    const headers = [
      "#",
      "Survey Question",
      "5",
      "4",
      "3",
      "2",
      "1",
      "N/A",
      "Total",
      "Overall %",
    ];
    const headerY = y;

    // Draw header background
    x = startX;
    for (let i = 0; i < headers.length; i++) {
      page.drawRectangle({
        x,
        y: headerY - 18,
        width: colWidths[i],
        height: 18,
        color: rgb(0.24, 0.37, 0.37),
      });
      x += colWidths[i];
    }

    // Draw header text
    x = startX;
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], {
        x: x + 4,
        y: headerY - 14,
        size: 9,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
      x += colWidths[i];
    }

    y -= 20;

    // Data rows
    let rowNum = 1;
    let totalGrandSA = 0,
      totalGrandA = 0,
      totalGrandN = 0,
      totalGrandD = 0,
      totalGrandSD = 0,
      totalGrandNA = 0;

    for (const [qId, tally] of tallyMap) {
      if (y < 50) {
        page = pdfDoc.addPage([595.28, 842.51]);
        y = page.getHeight() - margin;

        // Redraw header
        x = startX;
        for (let i = 0; i < headers.length; i++) {
          page.drawRectangle({
            x,
            y: y - 18,
            width: colWidths[i],
            height: 18,
            color: rgb(0.24, 0.37, 0.37),
          });
          x += colWidths[i];
        }

        x = startX;
        for (let i = 0; i < headers.length; i++) {
          page.drawText(headers[i], {
            x: x + 4,
            y: y - 14,
            size: 9,
            font: boldFont,
            color: rgb(1, 1, 1),
          });
          x += colWidths[i];
        }

        y -= 20;
      }

      const rowTotal =
        tally.stronglyAgree +
        tally.agree +
        tally.neutral +
        tally.disagree +
        tally.stronglyDisagree +
        tally.notAnswered;
      const answeredCount = rowTotal - tally.notAnswered;
      const satisfactionPercentage =
        answeredCount === 0
          ? "—"
          : `${(((tally.stronglyAgree + tally.agree) / answeredCount) * 100).toFixed(2)}%`;

      totalGrandSA += tally.stronglyAgree;
      totalGrandA += tally.agree;
      totalGrandN += tally.neutral;
      totalGrandD += tally.disagree;
      totalGrandSD += tally.stronglyDisagree;
      totalGrandNA += tally.notAnswered;

      const cellY = y;
      
      // Wrap question label into multiple lines
      const questionLines = wrapTextLines(tally.questionLabel, 50);
      const rowHeight = Math.max(14, questionLines.length * 8 + 4);
      
      const rowData = [
        rowNum.toString(),
        tally.questionLabel, // Will be drawn separately with line wrapping
        tally.stronglyAgree.toString(),
        tally.agree.toString(),
        tally.neutral.toString(),
        tally.disagree.toString(),
        tally.stronglyDisagree.toString(),
        tally.notAnswered.toString(),
        rowTotal.toString(),
        satisfactionPercentage,
      ];

      x = startX;
      for (let i = 0; i < rowData.length; i++) {
        if (i === 1) {
          // Draw wrapped question lines
          let lineY = cellY - 8;
          for (const line of questionLines) {
            page.drawText(line, {
              x: x + 4,
              y: lineY,
              size: 8,
              font,
              color: rgb(0.2, 0.2, 0.2),
            });
            lineY -= 8;
          }
        } else {
          // Draw other data (numbers) centered in row
          page.drawText(rowData[i], {
            x: x + 4,
            y: cellY - 10,
            size: 8,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        }
        x += colWidths[i];
      }

      y -= rowHeight;
      rowNum++;
    }

    // Footer row
    if (y < 40) {
      page = pdfDoc.addPage([595.28, 842.51]);
      y = page.getHeight() - margin;
    }

    const grandTotal = totalGrandSA + totalGrandA + totalGrandN + totalGrandD + totalGrandSD + totalGrandNA;
    const grandAnsweredCount = grandTotal - totalGrandNA;
    const grandSatisfactionPercentage =
      grandAnsweredCount === 0
        ? "—"
        : `${(((totalGrandSA + totalGrandA) / grandAnsweredCount) * 100).toFixed(2)}%`;

    // Draw footer background
    x = startX;
    for (let i = 0; i < colWidths.length; i++) {
      page.drawRectangle({
        x,
        y: y - 18,
        width: colWidths[i],
        height: 18,
        color: rgb(0.24, 0.37, 0.37),
      });
      x += colWidths[i];
    }

    const footerData = [
      "",
      "Total",
      totalGrandSA.toString(),
      totalGrandA.toString(),
      totalGrandN.toString(),
      totalGrandD.toString(),
      totalGrandSD.toString(),
      totalGrandNA.toString(),
      grandTotal.toString(),
      grandSatisfactionPercentage,
    ];

    x = startX;
    for (let i = 0; i < footerData.length; i++) {
      page.drawText(footerData[i], {
        x: x + 4,
        y: y - 14,
        size: 9,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
      x += colWidths[i];
    }

    // Add footer text
    y -= 30;
    page.drawText("ANECO Feedback System — Confidential", {
      x: margin,
      y,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="survey-response-tally-${formId}-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
