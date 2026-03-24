import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function KioskLandingPage() {
  const forms = await prisma.form.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <main className="flex min-h-screen w-full items-start justify-center bg-gradient-to-b from-brand-primary-soft via-background to-brand-secondary px-4 py-10 text-text-default">
      <section className="w-full max-w-5xl rounded-3xl border border-border-default bg-surface/95 p-6 shadow-xl backdrop-blur-md">
        <header className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-default bg-surface shadow-sm">
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
            <h1 className="text-4xl font-extrabold tracking-tight text-text-default">Aneco Survey Form</h1>
            <p className="mt-1 text-sm text-text-muted">Kiosk mode: choose a form and give a quick smiley rating.</p>
          </div>
        </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form: { formId: number; title: string; description: string | null; language: string }) => (
          <article
            key={form.formId}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-default bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-default">{form.title}</h2>
              <span className="rounded-full bg-brand-secondary px-2 py-1 text-xs font-semibold text-text-default">
                {form.language.toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{form.description ?? "No description provided."}</p>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">{new Date().toLocaleDateString()}</span>
              <Link
                href={`/kiosk/forms/${form.formId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary-strong px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary"
              >
                {form.language.toLowerCase() === "bis" ? "Ablihi" : "Open"}
                <ArrowRight size={14} className="text-white" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {forms.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border-default bg-surface-muted p-6 text-center text-sm text-text-muted">
          No active forms yet. Please check back later.
        </p>
      ) : null}
    </section>
  </main>
  );
}
