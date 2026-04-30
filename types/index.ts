// Password Strength Types
export interface PasswordStrengthRules {
  minLength: boolean; // 8+ characters
  hasUppercase: boolean; // A-Z
  hasLowercase: boolean; // a-z
  hasNumber: boolean; // 0-9
  hasSpecialChar: boolean; // !@#$%^&* etc
}

export type PasswordStrengthLevel = "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordStrengthResult {
  rules: PasswordStrengthRules;
  strength: PasswordStrengthLevel;
  rulesMet: number;
  isStrong: boolean; // true when all 5 rules pass
}

// Sentiment Types
export type SentimentType = "positive" | "negative" | "neutral";

export interface SentimentResult {
  sentiment: SentimentType;
  averageRating: number;
  totalResponses: number;
}

// Per-Question Stats
export interface PerQuestionStat {
  questionId: number;
  label: string;
  averageRating: number;
  highestScore: number;
  lowestScore: number;
  totalResponses: number;
}

// Response with question details
export interface ResponseWithQuestion {
  responseId: number;
  answervValue: number;
  question: {
    questionId: number;
    label: string;
  };
}

// Account creation/update form
export interface AccountFormData {
  username?: string; // For creation only
  email: string;
  name: string;
  password?: string; // Optional for edit, required for creation
}

export interface EditAccountFormData {
  email: string;
  name: string;
  password?: string; // Only if changing password
}

export type { ApiError, ApiResult, ApiSuccess, SessionPayload, UserRole } from "@/types/api";
