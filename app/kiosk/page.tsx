import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function KioskLandingPage() {
  const forms = await prisma.form.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Select a feedback form</h1>
        <p className="mt-1 text-slate-600">Kiosk mode: choose a form and submit a quick smiley rating.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {forms.map((form: { formId: number; title: string; description: string | null; language: string }) => (
          <article
            key={form.formId}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <h2 className="text-lg font-semibold text-slate-900">{form.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{form.description ?? "No description provided."}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {form.language.toUpperCase()}
              </span>
              <Link
                href={`/kiosk/forms/${form.formId}`}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                {form.language.toLowerCase() === "bis" ? "Ablihi ang porma" : "Open form"}
              </Link>
            </div>
          </article>
        ))}
      </div>

      {forms.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 p-6 text-slate-500">
          No active forms yet.
        </p>
      ) : null}
    </main>
  );
}
