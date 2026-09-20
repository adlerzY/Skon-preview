"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

  const refresh = useCallback(async () => {
    if (!hasLoginCookie()) {
      setState({ user: null, loading: false });
      return;
    }

    setState((current) => ({ ...current, loading: true }));

    try {
      const response = await fetch("/api/account/header-context", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = response.ok
        ? ((await response.json()) as { user?: HeaderViewerUser | null })
        : null;
      setState({
        user: data?.user ?? null,
        loading: false,
      });
    } catch {
      setState({ user: null, loading: false });
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
  }, [initialState, refresh]);

  const value = useMemo(() => state, [state]);
  return <HeaderViewerContext.Provider value={value}>{children}</HeaderViewerContext.Provider>;
}

export function useHeaderViewer() {
  return useContext(HeaderViewerContext);
}
