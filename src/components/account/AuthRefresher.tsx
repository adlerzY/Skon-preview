"use client";

import { useEffect } from "react";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE } from "@/lib/auth/constants";

const REFRESH_INTERVAL_MS = 20 * 60 * 60 * 1000;

export default function AuthRefresher() {
  useEffect(() => {
    const isLoggedIn = getClientCookie(LOGGED_IN_COOKIE) === "1";
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      fetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}