import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type NavbarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  profile?: ReactNode;
};

export function Navbar({ title, subtitle, actions, profile }: NavbarProps) {
  return (
    <header className="rounded-2xl border border-border bg-surface p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input placeholder="Search" className="pl-9" aria-label="Search" />
          </div>
          {actions}
          {profile}
        </div>
      </div>
    </header>
  );
}
