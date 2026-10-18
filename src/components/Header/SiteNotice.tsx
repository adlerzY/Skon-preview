"use client";

import { AlertCircle, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SiteNotice({
  title,
  message,
  desktop = false,
}: {
  title: string;
  message: string;
  desktop?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (desktop || !open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [desktop, open]);

  const popupPosition = desktop
    ? "left-1/2 top-full mt-2 w-[min(340px,calc(100vw-32px))] -translate-x-1/2 invisible pointer-events-none opacity-0 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100"
    : `left-0 top-full mt-2 w-[min(340px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] ${
        open ? "visible pointer-events-auto opacity-100" : "invisible pointer-events-none opacity-0"
      }`;

  return (
    <div
      ref={rootRef}
      className={`relative ${desktop ? "group flex flex-col items-center" : "flex items-center justify-center"}`}
    >
      <button
        type="button"
        onClick={desktop ? undefined : () => setOpen((value) => !value)}
        aria-expanded={desktop ? undefined : open}
        aria-label={open ? "بستن اطلاعیه سایت" : "باز کردن اطلاعیه سایت"}
        className="flex items-center justify-center gap-1.5 h-8 min-w-8 px-2 rounded-full bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover hover:border-brand-zard text-brand-zard transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70"
      >
        <AlertCircle size={17} />
        <ChevronDown size={14} className={`transition-transform ${!desktop && open ? "rotate-180" : ""}`} />
      </button>

      <div className={`absolute z-[10001] transition-all duration-150 ${popupPosition}`}>
        <div className="bg-brand-surface border border-brand-surface_hover rounded-[5px] p-3 shadow-[0_15px_30px_rgba(0,0,0,0.6)] text-right">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white leading-6">{title}</p>
            <p className="mt-1 text-xs text-brand-m_khonsa leading-6">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}