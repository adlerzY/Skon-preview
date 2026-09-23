"use client";

import { useLinkStatus } from "next/link";

export default function LinkPendingIndicator({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute right-0 left-0 top-0 h-[2px] overflow-hidden bg-brand-blue/20 ${className}`}
    >
      <span className="block h-full w-1/3 animate-[navigation-shimmer_900ms_ease-in-out_infinite] bg-brand-blue shadow-[0_0_10px_rgba(0,116,224,0.9)]" />
    </span>
  );
}
