import { ThankYouCountdown } from "@/components/kiosk/thank-you-countdown";
import Image from "next/image";

type SearchParams = Record<string, string | string[] | undefined>;

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function KioskThankYouPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const queryParams = await searchParams;
  const isBisaya = getFirstValue(queryParams.lang) === "bis";
  const formId = getFirstValue(queryParams.formId);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (key === "formId" || value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    } else {
      query.set(key, value);
    }
  }

  const fillMoreHref = formId
    ? `/kiosk/forms/${formId}${query.toString() ? `?${query.toString()}` : ""}`
    : `/kiosk${query.toString() ? `?${query.toString()}` : ""}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="relative w-full max-w-lg">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-[0_24px_48px_-28px_rgba(31,45,44,0.45)]">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-r from-primary to-primary-hover p-1 shadow-lg">
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
            <h1 className="text-3xl font-bold tracking-tight text-text-default">Thank you!</h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-wider text-primary">Feedback received</p>
            <p className="mt-4 text-sm text-text-muted">
              Your response is helping ANECO improve service quality. You will be redirected shortly.
            </p>
          </div>

          <div className="mt-8 space-y-3 rounded-2xl border border-border bg-surface-soft px-4 py-4 text-center">
            <ThankYouCountdown isBisaya={isBisaya} fillMoreHref={fillMoreHref} />
          </div>
        </div>
      </div>
    </main>
  );
}
