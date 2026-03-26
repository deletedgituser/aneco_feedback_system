import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Column<T> = {
  key: keyof T;
  label: string;
};

type ResponsiveTableProps<T extends Record<string, ReactNode>> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  className?: string;
};

export function ResponsiveTable<T extends Record<string, ReactNode>>({
  columns,
  rows,
  rowKey,
  className,
}: ResponsiveTableProps<T>) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface", className)}>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-raised text-text-secondary">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 text-left font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="border-t border-border text-text-primary">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row, index) => (
          <div key={rowKey(row, index)} className="rounded-xl border border-border bg-surface-raised p-4">
            {columns.map((column) => (
              <div key={String(column.key)} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                <span className="font-semibold text-text-secondary">{column.label}</span>
                <span className="text-right text-text-primary">{row[column.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
