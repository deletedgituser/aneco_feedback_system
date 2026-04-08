import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, MessageSquareText, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function KioskLandingPage() {
  let forms: Array<{ formId: number; title: string; description: string | null; language: string }> = [];

  try {
    forms = await prisma.form.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  } catch (error) {
    console.error("KioskLandingPage: Prisma query failed", error);
    forms = [];
  }

  return (
    <main className="flex min-h-screen w-full items-start justify-center px-4 py-8 text-text-default sm:px-6 sm:py-10">
      <section className="motion-fade-up relative w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -left-24 top-8 h-52 w-52 rounded-full bg-primary/8 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 -bottom-16 h-56 w-56 rounded-full bg-accent/12 blur-2xl" aria-hidden="true" />

        <header className="relative mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-soft ring-1 ring-border shadow-sm">
              <Image
                src="/logo.png"
                alt="ANECO logo"
                width={48}
                height={48}
                className="h-11 w-11 object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-default sm:text-5xl">Aneco Survey Form</h1>
              <p className="mt-2 text-base text-text-secondary sm:text-lg">Select a form below and share your smiley feedback.</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-success/18 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-text-default ring-1 ring-success/25">
            <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
            Kiosk Mode
          </div>
        </header>

        <div className="relative mb-4">
          <p className="text-sm font-bold uppercase tracking-wide text-text-muted">Available Forms</p>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-2">
          {forms.map((form: { formId: number; title: string; description: string | null; language: string }) => (
            <article
              key={form.formId}
              className="group flex h-full flex-col rounded-2xl border border-border bg-surface-soft p-5 shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-text-inverse shadow-sm ring-1 ring-primary/25">
                    {form.title.toLowerCase().includes("intern") ? <Users size={24} /> : <MessageSquareText size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-text-default">{form.title}</h2>
                  </div>
                </div>

                <span className="rounded-full bg-accent/24 px-3 py-1 text-xs font-bold text-text-default ring-1 ring-accent/30">
                  {form.language.toUpperCase()}
                </span>
              </div>

              <p className="mt-4 flex-grow text-lg leading-relaxed text-text-secondary">{form.description ?? "No description provided."}</p>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-text-muted">
                  <CalendarDays size={18} />
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>

                <Link
                  href={`/kiosk/forms/${form.formId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                >
                  {form.language.toLowerCase() === "bis" ? "Ablihi" : "Open"}
                  <ArrowRight size={14} className="text-white" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {forms.length === 0 ? (
          <p className="relative mt-8 rounded-2xl border border-dashed border-border bg-surface-soft p-6 text-center text-sm text-text-muted">
            No active forms yet. Please check back later.
          </p>
        ) : (
          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <p className="text-sm text-text-secondary">Tap a card to begin the survey.</p>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-default">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/80" aria-hidden="true" />
              {forms.length} forms available
            </p>
          </footer>
        )}
      </section>
    </main>
  );
}
