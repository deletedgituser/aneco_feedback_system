import { apiSuccess } from "@/lib/api/response";
import { getAnalyticsSummary } from "@/lib/services/analytics-service";

export async function GET() {
  const summary = await getAnalyticsSummary();

  return apiSuccess(summary);
}
