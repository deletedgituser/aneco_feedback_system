import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  buildResponseFilterSearchParams,
  getFormResponseReport,
  parsePage,
  parseResponseFilters,
} from "@/lib/services/response-report";
import { ResponsesPageTabs } from "@/components/responses/ResponsesPageTabs";
import { CollapsibleFilters } from "@/components/responses/CollapsibleFilters";
import { LiveRefresh } from "@/components/ui/live-refresh";

type FormResponsesPageProps = {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{
    page?: string;
    from?: string;
    to?: string;
    respondent?: string;
    assistedEmployee?: string;
  }>;
};

export default async function FormResponsesPage({ params, searchParams }: FormResponsesPageProps) {
  const { formId: formIdParam } = await params;
  const query = await searchParams;
  const formId = Number(formIdParam);

  if (!Number.isInteger(formId) || formId <= 0) {
    notFound();
  }

  const report = await getFormResponseReport({
    formId,
    page: parsePage(query.page),
    filters: parseResponseFilters(query),
  });
  if (!report) notFound();
  const responseReport = report;

  function makePageHref(targetPage: number): string {
    const params = buildResponseFilterSearchParams(responseReport.filters);
    params.set("page", String(targetPage));
    return `/responses/${formId}?${params.toString()}`;
  }

  const prevPageHref = responseReport.currentPage > 1 ? makePageHref(responseReport.currentPage - 1) : undefined;
  const nextPageHref = responseReport.currentPage < responseReport.totalPages ? makePageHref(responseReport.currentPage + 1) : undefined;

  return (
    <section className="space-y-6">
      <LiveRefresh />
      <div className="flex items-center gap-2">
        <Link
          href="/responses"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-default transition-colors duration-150 hover:bg-surface-soft"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
      </div>
      <header className="rounded-2xl border border-border bg-surface-soft p-6 flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-text-muted">Live Detail View</p>
          <h1 className="text-2xl font-semibold text-text-default">{responseReport.form.title}</h1>
          <p className="mt-1 text-sm text-text-muted">{responseReport.form.description ?? "No description"}</p>
          <div className="mt-3 inline-flex rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-default ring-1 ring-border">
            {responseReport.totalSubmissions} matching submissions
          </div>
        </div>
        <div className="flex-shrink-0">
          <CollapsibleFilters
            fromDateText={responseReport.filters.fromDateText}
            toDateText={responseReport.filters.toDateText}
            respondent={responseReport.filters.respondent}
            assistedEmployee={responseReport.filters.assistedEmployee}
            formId={formId}
            basePath={`/responses/${formId}`}
          />
        </div>
      </header>

      <section className="grid gap-2 rounded-2xl border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-border bg-surface-soft p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Total Submissions</p>
          <p className="mt-1 text-lg font-semibold text-text-default">{responseReport.totalSubmissions}</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface-soft p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Average Rating</p>
          <p className="mt-1 text-lg font-semibold text-text-default">{responseReport.averageRating}</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface-soft p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Response Items</p>
          <p className="mt-1 text-lg font-semibold text-text-default">{responseReport.totalResponseItems}</p>
        </article>
        <article className="rounded-2xl border border-border bg-surface-soft p-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Latest Order</p>
          <p className="mt-1 text-lg font-semibold text-text-default">Newest First</p>
        </article>
      </section>

      {responseReport.submissions.length > 0 ? (
        <ResponsesPageTabs
          submissions={responseReport.submissions}
          distribution={responseReport.ratingDistribution}
          sentimentDistribution={responseReport.sentimentDistribution}
          currentPage={responseReport.currentPage}
          totalPages={responseReport.totalPages}
          prevPageHref={prevPageHref}
          nextPageHref={nextPageHref}
          tallyRows={responseReport.tallyRows}
          formId={formId}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-text-muted">
          No responses yet for this form.
        </p>
      )}
    </section>
  );
}
