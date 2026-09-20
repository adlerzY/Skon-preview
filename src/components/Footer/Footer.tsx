import Link from "next/link";
import Image from "next/image";
import { Send, MessageCircle, Mail, TrendingUp } from "lucide-react";

export default function Footer({ activeRegion = "eu" }: { activeRegion?: string }) {

  const QUICK_LINKS = [
    { label: "فروشگاه", href: `/${activeRegion}` },
    { label: "وبلاگ", href: `/${activeRegion}/blog` },
    { label: "دانلود بازی", href: `/${activeRegion}/download` },
    { label: "پشتیبانی", href: `/${activeRegion}/support` },
  ];

  const ACCOUNT_LINKS = [
    { label: "حساب کاربری", href: "/my-account" },
    { label: "سفارش‌های من", href: "/my-account/orders" },
    { label: "تیکت‌های پشتیبانی", href: "/my-account/tickets" },
  ];

  const SOCIAL_LINKS = [
    { icon: Send, label: "تلگرام", href: "https://t.me/Arena2BattleSupport" },
    { icon: MessageCircle, label: "واتساپ", href: "https://wa.me/989120000000" },
    { icon: Mail, label: "ایمیل", href: "mailto:support@arena2battle.com" },
  ];

  return (
    <footer className="cv-auto w-full bg-brand-menu border-t border-brand-surface_hover mt-16" dir="rtl">
      <div className="container mx-auto px-6 max-w-site py-10 md:py-14 flex flex-col gap-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          <div className="lg:col-span-5 flex flex-col items-start gap-4">
            <Image
              src="/images/arena2battleLogo.webp"
              alt="Arena2Battle"
              width={140}
              height={45}
              style={{ width: "auto" }}
              className="h-10 w-auto object-contain"
            />
            <p className="text-xs text-brand-m_khonsa leading-relaxed max-w-sm">
              فروشگاه تخصصی بازی، گیفت‌کارت و خدمات درون‌برنامه‌ای گیمینگ با تحویل آنی و امن.
            </p>
            <Link
              href="https://wowtokenprice.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2.5 bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover hover:border-brand-blue/50 text-white text-xs font-bold px-6 py-3 transition-colors"
            >
              <TrendingUp size={15} className="text-brand-sabz shrink-0" />
              مشاهده آخرین قیمت توکن
            </Link>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 w-full">
            <FooterColumn title="دسترسی سریع" links={QUICK_LINKS} />
            <FooterColumn title="حساب کاربری" links={ACCOUNT_LINKS} />

            <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
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
        </div>

        <div className="border-t border-brand-surface_hover pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <span className="text-[11px] text-brand-m_khonsa">
            © {new Date().getFullYear()} <bdi>Arena2Battle</bdi> — تمامی حقوق محفوظ است.
          </span>

          <Link
            href="https://adlerzy.github.io/campfire"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-wrap items-center justify-center sm:justify-end gap-2 text-[13px]"
          >
            <span className="text-brand-m_khonsa">ساخته‌شده با </span>
            <span className="font-black tracking-wide bg-gradient-to-l from-brand-blue via-brand-zard to-brand-sabz bg-clip-text text-transparent group-hover:tracking-widest transition-all duration-300">
              ⚗️✨ جادوی adlerz 🪄
            </span>
            <span className="text-brand-m_khonsa">(خودمم نمیدونم چطوری)</span>
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