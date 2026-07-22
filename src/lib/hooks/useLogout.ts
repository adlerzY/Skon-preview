"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
      setIsLoggingOut(false);
    }
  }, [router]);

  return { logout, isLoggingOut };
}