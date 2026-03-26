"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ open, title, children, onClose, className }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-surface-dark/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={cn("w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-xl", className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors duration-150 ease-in-out hover:bg-surface-soft"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
