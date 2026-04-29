import { apiError, apiSuccess } from "@/lib/api/response";
import { parsePositiveInt } from "@/lib/api/request";
import { getFormTitleById } from "@/lib/services/form-service";

type Params = {
  params: Promise<{ formId: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const { formId: formIdParam } = await params;
  const formId = parsePositiveInt(formIdParam);

  if (!formId) {
    return apiError("Invalid form id.", 400, "INVALID_FORM_ID");
  }

  const title = await getFormTitleById(formId);

  if (!title) {
    return apiError("Form not found.", 404, "FORM_NOT_FOUND");
  }

  return apiSuccess({ title });
}