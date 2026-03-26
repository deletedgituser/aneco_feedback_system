"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="relative space-y-4 text-center">
      <h1 className="text-3xl font-semibold text-text-default">
        {isBisaya ? "Salamat sa imong feedback!" : "Thank you for your feedback!"}
      </h1>
      <p className="text-text-muted">
        {isBisaya ? `Mobalik sulod sa ${secondsLeft} segundos...` : `Redirecting in ${secondsLeft} seconds...`}
      </p>
      <Link
        href={fillMoreHref}
        className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        {isBisaya ? "Puno ug laing feedback" : "Fill more feedback"}
      </Link>
    </div>
  );
}
