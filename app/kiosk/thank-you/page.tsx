import { ThankYouCountdown } from "@/components/kiosk/thank-you-countdown";
import Image from "next/image";

export default function KioskThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-emerald-50 px-6 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
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

        <div className="mt-8 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4 text-center">
          <ThankYouCountdown />
        </div>
      </div>
    </main>
  );
}
