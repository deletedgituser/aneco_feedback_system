import { apiSuccess } from "@/lib/api/response";
import { getActiveKioskForms } from "@/lib/services/form-service";

export async function GET() {
  const forms = await getActiveKioskForms();

  return apiSuccess({ forms });
}
