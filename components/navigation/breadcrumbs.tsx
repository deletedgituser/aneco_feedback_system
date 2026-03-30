"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function toTitle(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname.split("/").filter(Boolean);
  const [responsesFormLabel, setResponsesFormLabel] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadResponsesFormLabel() {
      if (segments[0] !== "responses") {
        setResponsesFormLabel(null);
        return;
      }

      const formIdSegment = segments[1];
      if (!formIdSegment || !/^\d+$/.test(formIdSegment)) {
        setResponsesFormLabel(null);
        return;
      }

      try {
        const response = await fetch(`/api/forms/${formIdSegment}/breadcrumb`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load breadcrumb title");
        }

        const payload = (await response.json()) as { title?: string };
        if (active) {
          setResponsesFormLabel(payload.title?.trim() || "Form");
        }
      } catch {
        if (active) {
          setResponsesFormLabel("Form");
        }
      }
    }

    void loadResponsesFormLabel();

    return () => {
      active = false;
    };
  }, [segments]);

  if (segments.length === 0) {
    return null;
  }

  const mode = searchParams?.get("mode");
  const isDashboardRoute = segments[0] === "dashboard" || segments[0] === "responses" || segments[0] === "forms" || segments[0] === "analytics";

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-muted">
      <ol className="flex items-center gap-2">
        {isDashboardRoute ? (
          <li className="flex items-center gap-2">
            <span className="font-medium text-text-default">Personnel</span>
          </li>
        ) : null}
        {isDashboardRoute && segments.length > 0 ? <span>/</span> : null}
        {segments.map((segment, index) => {
          // Handle account ID navigation - go to edit page instead of non-existent account page
          let href = `/${segments.slice(0, index + 1).join("/")}`;
          if (segments[0] === "admin" && segments[1] === "accounts" && /^\d+$/.test(segment)) {
            if (index === 2) { // This is the account ID segment
              href = `/admin/accounts/${segment}/edit`;
            }
          }
          const isLast = index === segments.length - 1;
          const label =
            segments[0] === "responses" && index === 1 && /^\d+$/.test(segment)
              ? (responsesFormLabel ?? "Form")
              : segments[0] === "admin" && segments[1] === "accounts" && /^\d+$/.test(segment) && index === 2
              ? `Account ${segment}`
              : toTitle(segment);
          return (
            <li key={`breadcrumb-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span>/</span> : null}
              {isLast ? (
                <span className="font-medium text-text-default">{label}</span>
              ) : (
                <Link href={href} className="hover:text-primary">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
        {mode === "add" ? (
          <li className="flex items-center gap-2">
            <span>/</span>
            <span className="font-medium text-text-default">Add Form</span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
