import { addAccountFormSchema, editAccountFormSchema } from "@/lib/validation";

export function validateAddAccountInput(body: unknown) {
  const parsed = addAccountFormSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(issues).flat()[0] || "Validation failed";
    throw new Error(firstError);
  }

  return parsed.data;
}

export function validateEditAccountInput(body: unknown) {
  const parsed = editAccountFormSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(issues).flat()[0] || "Validation failed";
    throw new Error(firstError);
  }

  return parsed.data;
}

