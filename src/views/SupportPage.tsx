import Link from "next/link";
import { LifeBuoy, Send, MessageCircle, Mail, Clock, ShieldCheck, Download } from "lucide-react";
import SupportFAQ from "@/components/support/SupportFAQ";

const CONTACT_CHANNELS = [
  { icon: Send, label: "تلگرام", value: "@Arena2BattleSupport", href: "https://t.me/Arena2BattleSupport" },
  { icon: MessageCircle, label: "واتساپ", value: "پاسخگویی آنلاین", href: "https://wa.me/989120000000" },
  { icon: Mail, label: "ایمیل", value: "support@arena2battle.com", href: "mailto:support@arena2battle.com" },
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

export default function SupportPage({ region }: { region: string }) {
  return (
    <main className="container mx-auto px-6 max-w-site py-10 md:py-14 text-white" dir="rtl">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-black mb-3">پشتیبانی Arena2Battle</h1>
        <p className="text-brand-m_khonsa leading-7">
          هر سوالی درباره سفارش، روش‌های تحویل یا مشکلات فنی دارید، تیم پشتیبانی ما در کنار شماست.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
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

        <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <Clock size={16} className="text-brand-zard" /> ساعات پاسخگویی
          </span>
          <span className="text-xs text-brand-m_khonsa leading-6">هر روز هفته، از ساعت ۹ صبح تا ۱۲ شب</span>
          <div className="border-t border-brand-surface_hover my-1" />
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck size={16} className="text-brand-sabz" /> امنیت اطلاعات
          </span>
          <span className="text-xs text-brand-m_khonsa leading-6">اطلاعات حساب و پرداخت شما رمزنگاری و محافظت می‌شود</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {CONTACT_CHANNELS.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-surface border border-brand-surface_hover hover:border-brand-blue/50 p-5 flex items-center gap-3 transition-colors"
          >
            <span className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <channel.icon size={18} />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-white">{channel.label}</span>
              <span className="text-xs text-brand-m_khonsa truncate" dir="ltr">{channel.value}</span>
            </div>
          </a>
        ))}
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-black mb-5">سوالات متداول</h2>
        <SupportFAQ items={FAQ_ITEMS} />
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-brand-sabz/10 text-brand-sabz flex items-center justify-center shrink-0">
            <Download size={18} />
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">به دنبال دانلود بازی هستید؟</span>
            <span className="text-xs text-brand-m_khonsa">لینک دانلود مستقیم و پرسرعت بازی‌ها را اینجا پیدا کنید.</span>
          </div>
        </div>
        <Link href={`/${region}/download`} className="bg-brand-bg border border-brand-surface_hover hover:bg-brand-surface_hover text-white text-sm font-bold px-5 py-2.5 transition-colors whitespace-nowrap">
          صفحه دانلود
        </Link>
      </div>
    </main>
  );
}