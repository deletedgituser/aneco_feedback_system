"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function ThankYouCountdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secondsLeft, setSecondsLeft] = useState(4);
  const isBisaya = searchParams.get("lang") === "bis";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      router.push("/kiosk");
    }
  }, [secondsLeft, router]);

  const formId = searchParams.get("formId");
  const query = new URLSearchParams(searchParams.toString());
  query.delete("formId");

  const fillMoreHref = formId
    ? `/kiosk/forms/${formId}${query.toString() ? `?${query.toString()}` : ""}`
    : `/kiosk${query.toString() ? `?${query.toString()}` : ""}`;

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">
        {isBisaya ? "Salamat sa imong feedback!" : "Thank you for your feedback!"}
      </h1>
      <p className="text-slate-600">
        {isBisaya ? `Mobalik sulod sa ${secondsLeft} segundos...` : `Redirecting in ${secondsLeft} seconds...`}
      </p>
      <Link
        href={fillMoreHref}
        className="inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
      >
        {isBisaya ? "Puno ug laing feedback" : "Fill more feedback"}
      </Link>
    </div>
  );
}
