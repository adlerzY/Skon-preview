"use client";

import { Info } from "lucide-react";

export default function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group/tip align-middle mr-1">
      <Info size={13} className="text-brand-surface_m hover:text-brand-blue transition-colors cursor-help" />
      <span className="absolute bottom-[calc(100%+8px)] right-1/2 translate-x-1/2 w-56 bg-brand-menu border border-brand-surface_hover p-3 text-[11px] leading-relaxed text-brand-m_khonsa text-center opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 z-50 shadow-xl pointer-events-none">
        {text}
        <span className="absolute top-full right-1/2 translate-x-1/2 border-[6px] border-transparent border-t-brand-surface_hover" />
      </span>
    </span>
  );
}