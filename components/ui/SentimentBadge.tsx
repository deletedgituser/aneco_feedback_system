"use client";

import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import type { SentimentType } from "@/types";

interface SentimentBadgeProps {
  sentiment: SentimentType;
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const getStyles = (sentiment: SentimentType) => {
    switch (sentiment) {
      case "positive":
        return { bg: "bg-success", icon: ThumbsUp, label: "Positive" };
      case "negative":
        return { bg: "bg-error", icon: ThumbsDown, label: "Negative" };
      case "neutral":
        return { bg: "bg-warning", icon: Minus, label: "Neutral" };
      default:
        return { bg: "bg-gray-500", icon: Minus, label: "Unknown" };
    }
  };

  const styles = getStyles(sentiment);
  const IconComponent = styles.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white ${styles.bg}`}>
      <IconComponent size={14} />
      <span>{styles.label}</span>
    </div>
  );
}
