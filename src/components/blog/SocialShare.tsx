"use client";

import { useState } from "react";
import { Send, MessageCircle, Link2, Check, } from "lucide-react";

export default function SocialShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const links = [
    { icon: Send, label: "تلگرام", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { icon: MessageCircle, label: "واتساپ", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-brand-m_khonsa font-bold ml-1">اشتراک‌گذاری:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="w-9 h-9 flex items-center justify-center bg-brand-surface hover:bg-brand-surface_hover border border-white/5 text-brand-m_khonsa hover:text-white transition-colors rounded-lg"
        >
          <l.icon size={15} />
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="کپی لینک"
        className="w-9 h-9 flex items-center justify-center bg-brand-surface hover:bg-brand-surface_hover border border-white/5 text-brand-m_khonsa hover:text-white transition-colors rounded-lg"
      >
        {copied ? <Check size={15} className="text-brand-sabz" /> : <Link2 size={15} />}
      </button>
    </div>
  );
}