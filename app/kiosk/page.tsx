import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
    <main className="flex min-h-screen w-full items-start justify-center px-4 py-10 text-text-default">
      <section className="w-full max-w-5xl rounded-3xl border border-border bg-surface p-7 shadow-[0_24px_48px_-28px_rgba(31,45,44,0.4)]">
        <header className="mb-7 flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-soft shadow-sm">
            <Image
              src="/logo.png"
              alt="ANECO logo"
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-default sm:text-4xl">Aneco Survey Form</h1>
            <p className="mt-1 text-sm text-text-muted">Kiosk mode: choose a form and share your smiley feedback.</p>
          </div>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form: { formId: number; title: string; description: string | null; language: string }) => (
            <article
              key={form.formId}
              className="group flex h-full flex-col rounded-2xl border border-border bg-surface-soft p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-text-default">{form.title}</h2>
                <span className="rounded-full bg-accent/24 px-2.5 py-1 text-xs font-semibold text-text-default">
                  {form.language.toUpperCase()}
                </span>
              </div>
              <p className="mt-2 flex-grow text-sm leading-relaxed text-text-muted">{form.description ?? "No description provided."}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">{new Date().toLocaleDateString()}</span>
                <Link
                  href={`/kiosk/forms/${form.formId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
                >
                  {form.language.toLowerCase() === "bis" ? "Ablihi" : "Open"}
                  <ArrowRight size={14} className="text-white" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {forms.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface-soft p-6 text-center text-sm text-text-muted">
            No active forms yet. Please check back later.
          </p>
        ) : null}
      </section>
    </main>
  );
}
