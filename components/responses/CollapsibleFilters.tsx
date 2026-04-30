"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleFiltersProps {
  fromDateText: string;
  toDateText: string;
  respondent: string;
  assistedEmployee: string;
  formId: number;
  basePath?: string;
}

export function CollapsibleFilters({
  fromDateText,
  toDateText,
  respondent,
  assistedEmployee,
  formId,
  basePath = `/responses/${formId}`,
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = fromDateText || toDateText || respondent || assistedEmployee;

  return (
    <div className="w-72">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 border border-border rounded-xl bg-surface hover:bg-surface-soft transition"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-text-default">
          {hasActiveFilters ? "Filters Active" : "Filters"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <form className="absolute top-auto z-50 mt-1 rounded-xl border border-border bg-surface shadow-lg p-3 space-y-2 w-80">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="from" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                From
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={fromDateText}
                className="w-full rounded-lg border border-border bg-surface-soft px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="to" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                To
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={toDateText}
                className="w-full rounded-lg border border-border bg-surface-soft px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="respondent" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Respondent
              </label>
              <input
                id="respondent"
                name="respondent"
                defaultValue={respondent}
                placeholder="Name"
                className="w-full rounded-lg border border-border bg-surface-soft px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="assistedEmployee" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Assisted Emp.
              </label>
              <input
                id="assistedEmployee"
                name="assistedEmployee"
                defaultValue={assistedEmployee}
                placeholder="Name"
                className="w-full rounded-lg border border-border bg-surface-soft px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover"
            >
              Apply
            </button>
            <a
              href={basePath}
              className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-text-default hover:bg-surface-soft text-center"
            >
              Reset
            </a>
          </div>
        </form>
      )}
    </div>
  );
}
