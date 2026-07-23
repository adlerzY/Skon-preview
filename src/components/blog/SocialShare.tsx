import { Send, MessageCircle } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";

export default function SocialShare({ url, title }: { url: string; title: string }) {
  const links = [
    { icon: Send, label: "تلگرام", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { icon: MessageCircle, label: "واتساپ", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

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
      <CopyLinkButton url={url} />
    </div>
  );
}