// src/components/Footer/Footer.tsx
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Send, MessageCircle, Mail, TrendingUp } from "lucide-react";

const TOKEN_PRICE_URL = "#";

export default async function Footer() {
  const cookieStore = await cookies();
  const activeRegion = cookieStore.get("store_region")?.value || "eu";

  const QUICK_LINKS = [
    { label: "فروشگاه", href: `/${activeRegion}` },
    { label: "وبلاگ", href: `/${activeRegion}/blog` },
    { label: "دانلود بازی", href: `/${activeRegion}/download` },
    { label: "پشتیبانی", href: `/${activeRegion}/support` },
  ];

  const ACCOUNT_LINKS = [
    { label: "حساب کاربری", href: "/my-account" },
    { label: "سفارش‌های من", href: "/my-account/orders" },
    { label: "علاقه‌مندی‌ها", href: "/my-account/wishlist" },
    { label: "تیکت‌های پشتیبانی", href: "/my-account/tickets" },
  ];

  const SOCIAL_LINKS = [
    { icon: Send, label: "تلگرام", href: "https://t.me/Arena2BattleSupport" },
    { icon: MessageCircle, label: "واتساپ", href: "https://wa.me/989120000000" },
    { icon: Mail, label: "ایمیل", href: "mailto:support@arena2battle.com" },
  ];

return (
    <footer className="w-full bg-brand-menu border-t border-brand-surface_hover mt-16" dir="rtl">
      <div className="container mx-auto px-6 max-w-site py-12 flex flex-col gap-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Image
              src="/images/arena2battleLogo.webp"
              alt="Arena2Battle"
              width={110}
              height={40}
              className="h-9 w-auto object-contain"
            />
            <p className="text-xs text-brand-m_khonsa leading-relaxed max-w-[220px]">
              فروشگاه تخصصی بازی، گیفت‌کارت و خدمات درون‌برنامه‌ای گیمینگ با تحویل آنی و امن.
            </p>
          </div>

          <FooterColumn title="دسترسی سریع" links={QUICK_LINKS} />
          <FooterColumn title="حساب کاربری" links={ACCOUNT_LINKS} />

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-white">راه‌های ارتباطی</span>
            <div className="flex flex-col gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-brand-m_khonsa hover:text-white transition-colors w-fit"
                >
                  <s.icon size={14} />
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Link
          href={TOKEN_PRICE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center justify-center gap-2.5 min-w-[240px] bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover hover:border-brand-blue/50 text-white text-sm font-bold px-9 py-3.5 transition-colors"
        >
          <TrendingUp size={16} className="text-brand-sabz shrink-0" />
          مشاهده آخرین قیمت توکن
        </Link>

        <div className="border-t border-brand-surface_hover pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-brand-m_khonsa order-2 sm:order-1">
            © {new Date().getFullYear()} Arena2Battle — تمامی حقوق محفوظ است.
          </span>
          
          <Link
            href="https://github.com/adlerzY"
            target="_blank"
            rel="noopener noreferrer"
            className="order-1 sm:order-2 group flex items-center gap-2 text-[13px]"
          >
            <span className="text-brand-m_khonsa">ساخته‌شده با (خودمم نمیدونم چطوری)</span>
            <span className="font-black tracking-wide bg-gradient-to-l from-brand-blue via-brand-zard to-brand-sabz bg-clip-text text-transparent group-hover:tracking-widest transition-all duration-300">
              ⚗️✨ جادوی adlerz 🪄
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-bold text-white">{title}</span>
      <div className="flex flex-col gap-2.5">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-xs text-brand-m_khonsa hover:text-white transition-colors w-fit">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}