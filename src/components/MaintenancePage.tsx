import Image from "next/image";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main dir="rtl" className="min-h-[100dvh] bg-brand-bg text-brand-active flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg bg-brand-surface border border-brand-surface_hover p-8 md:p-10 text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/arena2battleLogo.webp"
            alt="Arena2Battle"
            width={170}
            height={58}
            priority
            className="h-11 w-auto object-contain"
          />
        </div>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-zard/10 text-brand-zard border border-brand-zard/20">
          <Wrench size={26} />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white">سایت در حال به‌روزرسانی است</h1>
        <p className="mt-3 text-sm leading-7 text-brand-m_khonsa">
          در حال اعمال تغییرات و بهبودهای سایت هستیم. لطفاً چند دقیقه بعد دوباره مراجعه کنید.
        </p>
        <div className="mt-6 text-[11px] text-brand-surface_m">خرید و پرداخت موقتاً غیرفعال است.</div>
      </section>
    </main>
  );
}
