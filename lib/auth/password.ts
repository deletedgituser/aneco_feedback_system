import bcrypt from "bcryptjs";

const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const NUMBER_RE = /[0-9]/;
const SPECIAL_RE = /[^A-Za-z0-9]/;

export function validatePasswordComplexity(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!UPPERCASE_RE.test(password)) {
    errors.push("Password must include at least one uppercase letter.");
  }
  if (!LOWERCASE_RE.test(password)) {
    errors.push("Password must include at least one lowercase letter.");
  }
  if (!NUMBER_RE.test(password)) {
    errors.push("Password must include at least one number.");
  }
  if (!SPECIAL_RE.test(password)) {
    errors.push("Password must include at least one special character.");
  }

  return errors;
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, 12);
}
