"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThankYouCountdown } from "@/components/kiosk/thank-you-countdown";
import Image from "next/image";

export default function KioskThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secondsLeft, setSecondsLeft] = useState(5);
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-emerald-50 px-6 py-10">
      <div className="relative w-full max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 p-1 shadow-lg">
          <Image
            src="/logo.png"
            alt="ANECO logo"
            width={56}
            height={56}
            className="rounded-full bg-white p-1"
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thank you!</h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-wider text-cyan-700">Feedback received</p>
          <p className="mt-4 text-sm text-slate-600">
            Your response is helping ANECO improve service quality. You will be redirected shortly.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4 text-center space-y-3">
          <ThankYouCountdown secondsLeft={secondsLeft} isBisaya={isBisaya} fillMoreHref={fillMoreHref} />
          <a
            href="/kiosk"
            className="inline-block rounded-md border border-cyan-500 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
          >
            Fill more
          </a>
        </div>
      </div>
    </div>
  </main>
  );
}
