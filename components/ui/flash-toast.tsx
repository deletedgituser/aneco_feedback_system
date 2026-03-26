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
      ? "border-success/30 bg-success-bg text-success-fg"
      : "border-danger/30 bg-error-bg text-error-fg";

  const liveMode = type === "error" ? "assertive" : "polite";
  const role = type === "error" ? "alert" : "status";

  return (
    <div className="fixed top-4 right-4 z-50 max-w-xs sm:max-w-sm">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl transition-all duration-300 ease-out ${styles}`}
        role={role}
        aria-live={liveMode}
      >
        {message}
      </div>
    </div>
  );
}
