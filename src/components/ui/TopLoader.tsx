"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_DELAY_MS = 90;
const FINISH_HOLD_MS = 80;
const FAILSAFE_MS = 5000;

function getCurrentKey() {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const navigatingRef = useRef(false);
  const lastKeyRef = useRef(getCurrentKey());
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current);
    startTimerRef.current = null;
    finishTimerRef.current = null;
    failsafeTimerRef.current = null;
  };

  const finishLoading = () => {
    navigatingRef.current = false;
    clearTimers();
    finishTimerRef.current = setTimeout(() => setVisible(false), FINISH_HOLD_MS);
  };

  const startLoading = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    clearTimers();
    startTimerRef.current = setTimeout(() => setVisible(true), START_DELAY_MS);
    failsafeTimerRef.current = setTimeout(finishLoading, FAILSAFE_MS);
  };

  useEffect(() => {
    lastKeyRef.current = getCurrentKey();
    if (navigatingRef.current) finishLoading();
  }, [pathname, searchParams]);

  useEffect(() => {
    const startFromTarget = (target: EventTarget | null) => {
      const element = target as Element | null;
      const anchor = element?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      const nextKey = url.pathname + url.search;
      if (nextKey === lastKeyRef.current) return;
      startLoading();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      startFromTarget(event.target);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Enter") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      startFromTarget(event.target);
    };

    const handlePopState = () => {
      if (getCurrentKey() === lastKeyRef.current) return;
      startLoading();
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100001] h-[2px] overflow-hidden bg-transparent pointer-events-none"
      dir="ltr"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری"
    >
      <div className="h-full w-1/3 animate-[navigation-shimmer_900ms_ease-in-out_infinite] bg-brand-blue shadow-[0_0_8px_rgba(0,116,224,0.55)]" />
    </div>
  );
}
