import Link from "next/link";
import Image from "next/image";
import { Home, LifeBuoy } from "lucide-react";

export default function NotFoundContent({ standalone = false }: { standalone?: boolean }) {
  return (
    <section
      dir="rtl"
      className={`flex w-full flex-col items-center justify-center gap-5 px-6 text-center ${
        standalone ? "min-h-[100dvh] bg-brand-bg" : "min-h-[60vh] py-16"
      }`}
    >
      {standalone && (
        <Link href="/" aria-label="صفحه اصلی">
          <Image
            src="/images/arena2battleLogo.webp"
            alt="Arena2Battle"
            width={140}
            height={48}
            style={{ width: "auto" }}
            className="h-11 w-auto object-contain"
          />
        </Link>
      )}

      <span dir="ltr" className="text-7xl md:text-8xl font-black leading-none text-brand-blue">
        404
      </span>

      <h1 className="text-xl md:text-2xl font-black text-white">صفحه‌ای که دنبالش بودی پیدا نشد</h1>

      <p className="max-w-md text-sm leading-7 text-brand-m_khonsa">
        ممکنه آدرس اشتباه وارد شده باشه یا این صفحه جابجا یا حذف شده باشه. از لینک‌های زیر می‌تونی ادامه بدی.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 bg-brand-blue hover:bg-[#0062d1] text-white text-sm font-bold px-5 py-2.5 transition-colors"
        >
          <Home size={15} />
          بازگشت به فروشگاه
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-2 bg-brand-surface border border-brand-surface_hover hover:bg-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-5 py-2.5 transition-colors"
        >
          <LifeBuoy size={15} />
          پشتیبانی
        </Link>
      </div>
    </section>
  );
}