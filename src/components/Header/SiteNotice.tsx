"use client";

import { AlertCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

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

  return (
    <div className={`relative ${desktop ? "group flex flex-col items-center" : "flex items-center justify-center"}`}>
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

      <div
        className={`absolute z-[10001] w-[min(340px,calc(100vw-32px))] transition-all duration-150 ${
          desktop
            ? "left-1/2 top-full mt-2 -translate-x-1/2 invisible pointer-events-none opacity-0 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100"
            : `left-1/2 top-full mt-2 -translate-x-1/2 ${open ? "visible pointer-events-auto opacity-100" : "invisible pointer-events-none opacity-0"}`
        }`}
      >
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
