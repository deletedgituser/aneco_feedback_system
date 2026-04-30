import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import type { SentimentType } from "@/types";
import { LiveRefresh } from "@/components/ui/live-refresh";

type StatusFilter = "all" | "active" | "inactive";

function parseStatusFilter(value: string | undefined): StatusFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }
  return "all";
}

function computeSentiment(averageRating: number | null): SentimentType {
  if (averageRating === null) return "neutral";
  if (averageRating >= 4) return "positive";
  if (averageRating <= 2) return "negative";
  return "neutral";
}

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const query = await searchParams;
  const statusFilter = parseStatusFilter(query.status);

  function buildResponsesHref(nextStatus: StatusFilter): string {
    const params = new URLSearchParams();
    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }
    return `/responses${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const forms = await prisma.form.findMany({
    where: statusFilter === "all" ? undefined : { isActive: statusFilter === "active" },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      formId: true,
      title: true,
      description: true,
      isActive: true,
      _count: {
        select: {
          feedbacks: true,
        },
      },
      feedbacks: {
        select: {
          responses: {
            select: {
              answerValue: true,
            },
          },
        },
      },
    },
  });

  // Calculate average rating for each form
  const formsWithSentiment = forms.map((form) => {
    const allRatings: number[] = [];
    form.feedbacks.forEach((feedback) => {
      feedback.responses.forEach((response) => {
        if (response.answerValue !== null) {
          allRatings.push(response.answerValue);
        }
      });
    });

    const averageRating = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : null;
    const sentiment = computeSentiment(averageRating);

    return {
      formId: form.formId,
      title: form.title,
      description: form.description,
      isActive: form.isActive,
      feedbackCount: form._count.feedbacks,
      sentiment,
    };
  });

  return (
    <section className="space-y-6">
      <LiveRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Live Responses</p>
          <h1 className="text-2xl font-semibold text-text-default">Form Responses</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildResponsesHref("all")}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              statusFilter === "all"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-default hover:bg-surface-soft"
            }`}
          >
            All
          </Link>
          <Link
            href={buildResponsesHref("active")}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              statusFilter === "active"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-default hover:bg-surface-soft"
            }`}
          >
            Active
          </Link>
          <Link
            href={buildResponsesHref("inactive")}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              statusFilter === "inactive"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-default hover:bg-surface-soft"
            }`}
          >
            Inactive
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {formsWithSentiment.map((form) => (
          <article
            key={form.formId}
            className={`flex h-full flex-col rounded-2xl border border-border p-5 ${
              form.isActive ? "bg-surface" : "bg-surface-muted"
            }`}
          >
            <h2 className="font-semibold text-text-default">{form.title}</h2>
            <p className="mt-1 flex-grow text-sm text-text-muted">{form.description ?? "No description"}</p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    form.isActive ? "bg-success/20 text-success" : "bg-danger/18 text-danger"
                  }`}
                >
                  {form.isActive ? "Active" : "Inactive"}
                </span>
                {form.feedbackCount > 0 && <SentimentBadge sentiment={form.sentiment} />}
              </div>
              <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold text-text-default ring-1 ring-border">
                {form.feedbackCount} submissions
              </span>
            </div>

            <div className="mt-4">
              <Link
                href={`/responses/${form.formId}`}
                className="inline-flex rounded-xl border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-soft"
              >
                Open Form Responses
              </Link>
            </div>
          </article>
        ))}

        {formsWithSentiment.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted md:col-span-2">
            No forms found yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
