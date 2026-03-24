import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ResponsesPage() {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
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
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Form Responses</h1>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {forms.map((form) => (
          <article key={form.formId} className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">{form.title}</h2>
            <p className="mt-1 flex-grow text-sm text-slate-600">{form.description ?? "No description"}</p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {form.isActive ? "Active" : "Inactive"}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {form._count.feedbacks} submissions
              </span>
            </div>

            <div className="mt-4">
              <Link
                href={`/responses/${form.formId}`}
                className="inline-flex rounded-md border border-cyan-300 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
              >
                Open Form Responses
              </Link>
            </div>
          </article>
        ))}

        {forms.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 md:col-span-2">
            No forms found yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
