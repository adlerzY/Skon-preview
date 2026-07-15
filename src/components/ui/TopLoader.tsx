"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_DELAY_MS = 100;
const TRICKLE_INTERVAL_MS = 120;
const FINISH_HOLD_MS = 120;

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const isNavigatingRef = useRef(false);
  const visibleRef = useRef(false);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const clearTimers = () => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    if (trickleRef.current) clearInterval(trickleRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    startTimerRef.current = null;
    trickleRef.current = null;
    finishTimerRef.current = null;
  };

  const startLoading = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    startTimerRef.current = setTimeout(() => {
      setVisible(true);
      setProgress(30);
      trickleRef.current = setInterval(() => {
        setProgress((p) => (p >= 92 ? p : p + Math.max(1, (92 - p) * 0.12)));
      }, TRICKLE_INTERVAL_MS);
    }, START_DELAY_MS);
  };

  const finishLoading = () => {
    if (!isNavigatingRef.current) return;
    isNavigatingRef.current = false;
    clearTimers();

    if (!visibleRef.current) {
      setProgress(0);
      return;
    }

    setProgress(100);
    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, FINISH_HOLD_MS);
  };

  useEffect(() => {
    finishLoading();
  }, [pathname, searchParams]);

  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args) {
      startLoading();
      return originalPushState(...args);
    };
    window.history.replaceState = function (...args) {
      startLoading();
      return originalReplaceState(...args);
    };

    const handlePopState = () => startLoading();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-[100001] h-[3px] bg-transparent pointer-events-none" dir="ltr">
      <div
        className="h-full bg-brand-blue shadow-[0_0_10px_rgba(0,116,224,0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}