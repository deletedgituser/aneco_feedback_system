"use client";

import Link from "next/link";

type ThankYouCountdownProps = {
  secondsLeft: number;
  isBisaya: boolean;
  fillMoreHref: string;
};

export function ThankYouCountdown({ secondsLeft, isBisaya, fillMoreHref }: ThankYouCountdownProps) {
  return (
    <div className="relative space-y-4 text-center">
      <h1 className="text-3xl font-semibold text-text-default">
        {isBisaya ? "Salamat sa imong feedback!" : "Thank you for your feedback!"}
      </h1>
      <p className="text-text-muted">
        {isBisaya ? `Mobalik sulod sa ${secondsLeft} segundos...` : `Redirecting in ${secondsLeft} seconds...`}
      </p>
      <Link
        href={fillMoreHref}
        className="inline-flex rounded-lg bg-brand-primary-strong px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
      >
        {isBisaya ? "Puno ug laing feedback" : "Fill more feedback"}
      </Link>
    </div>
  );
}
