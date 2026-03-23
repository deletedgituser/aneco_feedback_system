"use client";

import { useRouter } from "next/navigation";

type ConfirmDeleteButtonProps = {
  formId: number;
  children: React.ReactNode;
};

export function ConfirmDeleteButton({ formId, children }: ConfirmDeleteButtonProps) {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirm("Delete this account? This cannot be undone.")) {
      event.preventDefault();
      return;
    }

    // optional: nothing else, form submit will proceed
  };

  return (
    <button
      type="submit"
      onClick={handleClick}
      className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
    >
      {children}
    </button>
  );
}
