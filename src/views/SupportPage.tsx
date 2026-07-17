// src/views/SupportPage.tsx
import Link from "next/link";
import Image from "next/image";
import { LifeBuoy, Clock, ShieldCheck, Star, Download } from "lucide-react";
import SupportFAQ from "@/components/support/SupportFAQ";

interface ContactChannel {
  icon: string;
  label: string;
  value: string;
  href: string;
  responseTime: string;
}

const CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon: "/images/support/telegram.png",
    label: "تلگرام",
    value: "@Arena2BattleSupport",
    href: "https://t.me/Arena2BattleSupport",
    responseTime: "پاسخ در کمتر از ۵ دقیقه",
  },
  {
    icon: "/images/support/whatsapp.png",
    label: "واتساپ",
    value: "پاسخگویی آنلاین",
    href: "https://wa.me/989120000000",
    responseTime: "پاسخگویی آنلاین و سریع",
  },
  {
    icon: "/images/support/email.png",
    label: "ایمیل",
    value: "support@arena2battle.com",
    href: "mailto:support@arena2battle.com",
    responseTime: "پاسخ در کمتر از ۲۴ ساعت",
  },
];

const FAQ_ITEMS = [
  {
    question: "چه مدت طول می‌کشد سفارش من تحویل داده شود؟",
    answer:
      "روش «کد اصلی» بلافاصله پس از پرداخت در پنل کاربری نمایش داده می‌شود. روش «مستقیم» معمولاً در کمتر از یک ساعت انجام می‌شود و روش «گیفت» تا ۳ روز کاری زمان می‌برد.",
  },
  {
    question: "اطلاعات اکانت من چقدر امن است؟",
    answer:
      "اطلاعات ورود اکانت شما رمزنگاری‌شده ذخیره می‌شود و پس از تکمیل یا لغو سفارش به‌صورت خودکار حذف می‌گردد. فقط تیم پشتیبانی مجاز و فقط تا پیش از تکمیل سفارش به آن دسترسی دارد.",
  },
  {
    question: "چطور می‌توانم وضعیت سفارشم را پیگیری کنم؟",
    answer: "از بخش «سفارش‌های من» در پیشخوان حساب کاربری می‌توانید وضعیت هر سفارش و مراحل تحویل آن را مشاهده کنید.",
  },
  {
    question: "در صورت بروز مشکل در سفارش چه کار کنم؟",
    answer:
      "می‌توانید از طریق دکمه «ثبت تیکت جدید» در همین صفحه، با انتخاب سفارش مرتبط، مشکل خود را برای تیم پشتیبانی شرح دهید تا در سریع‌ترین زمان بررسی شود.",
  },
  {
    question: "آیا امکان بازگشت وجه وجود دارد؟",
    answer:
      "در صورتی که سفارش شما به هر دلیلی قابل تحویل نباشد، پس از بررسی تیم پشتیبانی، مبلغ پرداختی از طریق درگاه پرداخت به حساب شما بازگردانده می‌شود.",
  },
];

function StatRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-white">{title}</span>
        <span className="text-xs text-brand-m_khonsa leading-6">{desc}</span>
      </div>
    </div>
  );
}

export default function SupportPage({ region }: { region: string }) {
  return (
    <main className="container mx-auto px-6 max-w-site py-10 md:py-14 text-white flex flex-col gap-10 md:gap-14" dir="rtl">
      <div className="relative w-full h-[240px] sm:h-[280px] md:h-[340px] overflow-hidden border border-brand-surface_hover shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)]">
        <Image
          src="/images/support-hero.webp"
          alt="پشتیبانی Arena2Battle"
          fill
          priority
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111215] via-[#111215]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#111215]/95 via-[#111215]/30 to-transparent w-full md:w-2/3" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10 gap-3 max-w-xl">
          <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold text-brand-sabz bg-brand-sabz/10 border border-brand-sabz/20 px-2.5 py-1">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-brand-sabz opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-brand-sabz" />
            </span>
            پشتیبانی هم‌اکنون پاسخگوست
          </span>
          <h1 className="text-2xl md:text-4xl font-black leading-tight">پشتیبانی Arena2Battle</h1>
          <p className="text-brand-m_khonsa text-sm md:text-base leading-7">
            هر سوالی درباره سفارش، روش‌های تحویل یا مشکلات فنی دارید، تیم پشتیبانی ما در کنار شماست.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <LifeBuoy size={20} />
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white">ثبت تیکت پشتیبانی</span>
              <span className="text-xs text-brand-m_khonsa">سریع‌ترین راه برای پیگیری مشکلات سفارش</span>
            </div>
          </div>
          <p className="text-sm text-brand-m_khonsa leading-7">
            برای پیگیری دقیق سفارش‌ها، ابتدا وارد حساب کاربری خود شوید و سپس از بخش تیکت‌های پشتیبانی، درخواست خود را با جزئیات ثبت کنید.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/my-account/tickets/new" className="bg-brand-blue hover:bg-[#0062d1] text-white text-sm font-bold px-5 py-2.5 transition-colors">
              ثبت تیکت جدید
            </Link>
            <Link href="/my-account/tickets" className="bg-brand-bg border border-brand-surface_hover hover:bg-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-5 py-2.5 transition-colors">
              مشاهده تیکت‌های من
            </Link>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-4">
          <StatRow icon={<Clock size={16} className="text-brand-zard" />} title="ساعات پاسخگویی" desc="هر روز هفته، از ساعت ۹ صبح تا ۱۲ شب" />
          <div className="border-t border-brand-surface_hover" />
          <StatRow icon={<ShieldCheck size={16} className="text-brand-sabz" />} title="امنیت اطلاعات" desc="اطلاعات حساب و پرداخت شما رمزنگاری و محافظت می‌شود (جدی همینطوره)" />
          <div className="border-t border-brand-surface_hover" />
          <StatRow icon={<Star size={16} className="text-brand-blue" />} title="رضایت مشتریان" desc="بیش از 100٪ رضایت در سفارش‌های تکمیل‌شده (مثلا)" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black">راه‌های ارتباطی</h2>
        <div className="flex flex-col gap-3 max-w-2xl">
          {CONTACT_CHANNELS.map((channel) => (
            <Link 
              key={channel.label}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-surface border border-brand-surface_hover hover:border-brand-blue/50 p-4 md:p-5 flex items-center gap-4 transition-colors"
            >
              <span className="w-12 h-12 shrink-0 flex items-center justify-center bg-brand-bg border border-brand-surface_hover">
                <Image src={channel.icon} alt={channel.label} width={24} height={24} className="object-contain" />
              </span>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                <span className="font-bold text-sm text-white">{channel.label}</span>
                <span className="text-xs text-brand-m_khonsa truncate" dir="ltr">{channel.value}</span>
              </div>
              <span className="text-[11px] text-brand-sabz font-bold whitespace-nowrap shrink-0 hidden sm:inline-block">
                {channel.responseTime}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-black">سوالات متداول</h2>
        <SupportFAQ items={FAQ_ITEMS} />
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-brand-sabz/10 text-brand-sabz flex items-center justify-center shrink-0">
            <Download size={18} />
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">میخوای با نت داخلی بازیارو دانلود کنی؟ نگران نباش بیا پیش عمو</span>
            <span className="text-xs text-brand-m_khonsa">لینک دانلود مستقیم و پرسرعت بازی‌ها را اینجا پیدا میکنی.</span>
          </div>
        </div>
        <Link href={`/${region}/download`} className="bg-brand-bg border border-brand-surface_hover hover:bg-brand-surface_hover text-white text-sm font-bold px-5 py-2.5 transition-colors whitespace-nowrap">
         بخدا گولت نمیزنم همش همینجاست
        </Link>
      </div>
    </main>
  );
}