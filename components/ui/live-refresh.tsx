"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type LiveRefreshProps = {
  intervalMs?: number;
};

export function LiveRefresh({ intervalMs = 15000 }: LiveRefreshProps) {
  const router = useRouter();
  const activeRef = useRef(true);

  useEffect(() => {
    const onVisibilityChange = () => {
      activeRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = window.setInterval(() => {
      if (activeRef.current) {
        router.refresh();
      }
    }, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [intervalMs, router]);

  return null;
}