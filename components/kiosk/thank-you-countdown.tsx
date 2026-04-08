"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui/progress-bar";

type ThankYouCountdownProps = {
  isBisaya: boolean;
  fillMoreHref: string;
  initialSeconds?: number;
  redirectHref?: string;
};

export function ThankYouCountdown({
  isBisaya,
  fillMoreHref,
  initialSeconds = 5,
  redirectHref = "/kiosk",
}: ThankYouCountdownProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const progress = ((initialSeconds - secondsLeft) / initialSeconds) * 100;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      router.push(redirectHref);
    }
  }, [secondsLeft, router, redirectHref]);

  return (
    <div className="motion-fade-up relative space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-text-default sm:text-3xl">
        {isBisaya ? "Salamat sa imong feedback!" : "Thank you for your feedback!"}
      </h1>
      <p className="text-sm text-text-muted sm:text-base">
        {isBisaya ? `Mobalik sulod sa ${secondsLeft} segundos...` : `Redirecting in ${secondsLeft} seconds...`}
      </p>
      <ProgressBar value={progress} className="mx-auto max-w-xs" />
      <Link
        href={fillMoreHref}
        className="motion-shimmer inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      >
        {isBisaya ? "Puno ug laing feedback" : "Fill more feedback"}
      </Link>
    </div>
  );
}
