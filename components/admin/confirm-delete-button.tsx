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
        className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
      >
        {children}
      </button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/30 p-4">
          <div className="max-w-sm rounded-xl border border-border-default bg-surface p-5 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold text-text-default">Confirm Delete</h3>
            <p className="mb-4 text-sm text-text-muted">Are you sure you want to delete? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-border-default px-3 py-1.5 text-xs font-semibold text-text-default hover:bg-brand-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
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
