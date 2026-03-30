import type { SentimentResult, SentimentType } from "@/types";

/**
 * Computes sentiment from a list of numeric ratings (typically 1-5)
 * Thresholds: 
 * - Average >= 4 => "positive" (high satisfaction)
 * - Average <= 2 => "negative" (low satisfaction)
 * - Otherwise => "neutral" (mixed feedback)
 */
export function computeSentiment(ratings: number[]): SentimentResult {
  if (ratings.length === 0) {
    return {
      sentiment: "neutral",
      averageRating: 0,
      totalResponses: 0,
    };
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  const averageRating = Number((total / ratings.length).toFixed(2));

  let sentiment: SentimentType;
  if (averageRating >= 4) {
    sentiment = "positive";
  } else if (averageRating <= 2) {
    sentiment = "negative";
  } else {
    sentiment = "neutral";
  }

  return {
    sentiment,
    averageRating,
    totalResponses: ratings.length,
  };
}
