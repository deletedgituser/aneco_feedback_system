import { LoginForm } from "@/components/auth/login-form";
import { FlashToast } from "@/components/ui/flash-toast";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ toastType?: "success" | "error"; toastMessage?: string }>;
}) {
  const session = await getSessionPayload();
  if (session?.sid) {
    const active = await isSessionActive(session.sid);
    if (active) {
      redirect("/dashboard");
    }
  }

  const query = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <section className="w-full rounded-xl border border-border-default bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Image src="/logo.png" alt="ANECO logo" width={40} height={40} className="rounded-full" />
          <div>
            <h1 className="text-2xl font-semibold text-text-default">ANECO Survey System</h1>
            <p className="text-xs text-text-muted">Secure access for admin and personnel</p>
          </div>
        </div>
        {query.toastType && query.toastMessage ? (
          <div className="mb-4">
            <FlashToast type={query.toastType} message={query.toastMessage} />
          </div>
        ) : null}
        <p className="mt-1 text-sm text-text-muted">Shared login for admin and personnel accounts.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
