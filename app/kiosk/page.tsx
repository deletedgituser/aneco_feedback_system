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
    <main className="flex min-h-screen w-full items-start justify-center bg-gradient-to-b from-slate-50 via-white to-cyan-50 px-4 py-10 text-slate-800">
      <section className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-md">
        <header className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-white shadow-sm">
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
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Aneco Survey Form</h1>
            <p className="mt-1 text-sm text-slate-600">Kiosk mode: choose a form and give a quick smiley rating.</p>
          </div>
        </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form: { formId: number; title: string; description: string | null; language: string }) => (
          <article
            key={form.formId}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{form.title}</h2>
              <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-800">
                {form.language.toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{form.description ?? "No description provided."}</p>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{new Date().toLocaleDateString()}</span>
              <Link
                href={`/kiosk/forms/${form.formId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
              >
                {form.language.toLowerCase() === "bis" ? "Ablihi" : "Open"}
                <ArrowRight size={14} className="text-cyan-50" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {forms.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No active forms yet. Please check back later.
        </p>
      ) : null}
    </section>
  </main>
  );
}
