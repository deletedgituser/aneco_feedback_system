import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { parseOptionalDateRange, parsePositiveInt } from "@/lib/api/request";
import { getAnalyticsCharts } from "@/lib/services/analytics-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const formId = parsePositiveInt(searchParams.get("formId"));
  const assistedEmployee = searchParams.get("assistedEmployee")?.trim();
  const { from, to } = parseOptionalDateRange(searchParams);

  const data = await getAnalyticsCharts({
    formId: formId ?? undefined,
    assistedEmployee: assistedEmployee || undefined,
    from: from ?? undefined,
    to: to ?? undefined,
  });

  return apiSuccess(data);
}
