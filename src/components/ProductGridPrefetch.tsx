"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface ProductGridPrefetchProps {
  children: ReactNode;
}

export default function ProductGridPrefetch({ children }: ProductGridPrefetchProps) {
  const router = useRouter();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefetchFromTarget = (target: EventTarget | null) => {
      const element = target as Element | null;
      const anchor = element?.closest?.("a[data-product-prefetch='true']") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const key = `${url.pathname}${url.search}`;
      if (prefetchedRef.current.has(key)) return;

      prefetchedRef.current.add(key);
      router.prefetch(key);
    };

    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      prefetchFromTarget(event.target);
    };

    const handleFocusIn = (event: FocusEvent) => {
      prefetchFromTarget(event.target);
    };

    const root = rootRef.current;
    if (!root) return;

    root.addEventListener("pointerover", handlePointerOver, { passive: true });
    root.addEventListener("focusin", handleFocusIn);

    return () => {
      root.removeEventListener("pointerover", handlePointerOver);
      root.removeEventListener("focusin", handleFocusIn);
    };
  }, [router]);

  return <div ref={rootRef} className="contents">{children}</div>;
}
