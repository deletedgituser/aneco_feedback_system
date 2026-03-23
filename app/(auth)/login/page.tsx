import { LoginForm } from "@/components/auth/login-form";
import { getSessionPayload, isSessionActive } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSessionPayload();
  if (session?.sid) {
    const active = await isSessionActive(session.sid);
    if (active) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">ANECO System Login</h1>
        <p className="mt-1 text-sm text-slate-600">Shared login for admin and personnel accounts.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
