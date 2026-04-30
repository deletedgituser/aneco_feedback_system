import { LoginForm } from "@/components/auth/login-form";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Image from "next/image";
import { FlashToast } from "@/components/ui/flash-toast";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ toastType?: "success" | "error"; toastMessage?: string }>;
}) {
  const query = await searchParams;
  const session = await getSessionPayload();
  if (session?.sid) {
    const active = await isSessionActive(session.sid);
    if (active) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      {query.toastType && query.toastMessage ? <FlashToast type={query.toastType} message={query.toastMessage} /> : null}
      <section className="w-full rounded-2xl border border-border bg-surface p-8 shadow-[0_16px_40px_-22px_rgba(31,45,44,0.35)]">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/logo.png" alt="ANECO logo" width={42} height={42} className="rounded-full p-1" />
          <div>
            <h1 className="text-xl font-semibold text-text-default">ANECO Feedback System</h1>
            <p className="text-xs uppercase tracking-wide text-text-muted">Secure access for admin and personnel</p>
          </div>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">Shared login for administrator and personnel accounts.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
