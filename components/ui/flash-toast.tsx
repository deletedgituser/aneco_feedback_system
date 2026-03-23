"use client";

import { useEffect, useState } from "react";

type FlashToastProps = {
  type: "success" | "error";
  message: string;
};

export function FlashToast({ type, message }: FlashToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className={`mb-4 rounded-md border px-4 py-3 text-sm font-medium ${styles}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
