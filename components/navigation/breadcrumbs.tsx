"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function toTitle(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex items-center gap-2">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          return (
            <li key={href} className="flex items-center gap-2">
              {index > 0 ? <span>/</span> : null}
              {isLast ? (
                <span className="font-medium text-slate-700">{toTitle(segment)}</span>
              ) : (
                <Link href={href} className="hover:text-slate-800">
                  {toTitle(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
