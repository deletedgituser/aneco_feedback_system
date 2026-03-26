"use client";

import { useState } from "react";

type ConfirmDeleteButtonProps = {
  formId: number;
  children: React.ReactNode;
};

export function ConfirmDeleteButton({ formId, children }: ConfirmDeleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleTrigger = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setConfirmOpen(true);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleTrigger}
        aria-label={`Delete item ${formId}`}
        className="rounded-xl border border-danger/45 bg-surface px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/12"
      >
        {children}
      </button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/30 p-4">
          <div className="max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-text-default">Confirm Delete</h3>
            <p className="mb-4 text-sm text-text-muted">Are you sure you want to delete? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text-default hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger/90"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
