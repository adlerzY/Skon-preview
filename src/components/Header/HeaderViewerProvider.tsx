"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface HeaderViewerUser {
  name: string;
  avatarUrl: string | null;
  isStaff?: boolean;
}

interface HeaderViewerState {
  user: HeaderViewerUser | null;
  loading: boolean;
}

const HeaderViewerContext = createContext<HeaderViewerState>({
  user: null,
  loading: false,
});

const AUTH_STATE_EVENT = "a2b-auth-state-changed";
const REQUEST_TIMEOUT_MS = 8000;

function hasLoginCookie() {
  return typeof document !== "undefined" && document.cookie.split(";").some((part) => part.trim().startsWith("a2b_logged_in=1"));
}

export function notifyAuthStateChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
}

export function HeaderViewerProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: HeaderViewerState;
}) {
  const [state, setState] = useState<HeaderViewerState>(
    initialState ?? { user: null, loading: true },
  );
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();

    if (!hasLoginCookie()) {
      abortRef.current = null;
      setState({ user: null, loading: false });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    setState((current) => (current.loading ? current : { ...current, loading: true }));

    try {
      const response = await fetch("/api/account/header-context", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      const data = response.ok
        ? ((await response.json()) as { user?: HeaderViewerUser | null })
        : null;
      if (abortRef.current !== controller) return;
      setState({ user: data?.user ?? null, loading: false });
    } catch {
      if (abortRef.current !== controller) return;
      setState({ user: null, loading: false });
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    const handleAuthStateChanged = () => {
      void refresh();
    };

    window.addEventListener(AUTH_STATE_EVENT, handleAuthStateChanged);
    return () => window.removeEventListener(AUTH_STATE_EVENT, handleAuthStateChanged);
  }, [refresh]);

  useEffect(() => {
    if (initialState && !initialState.loading) return;
    void refresh();
    return () => abortRef.current?.abort();
  }, [initialState, refresh]);

  const value = useMemo(() => state, [state]);
  return <HeaderViewerContext.Provider value={value}>{children}</HeaderViewerContext.Provider>;
}

export function useHeaderViewer() {
  return useContext(HeaderViewerContext);
}