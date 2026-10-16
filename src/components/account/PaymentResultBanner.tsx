"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const MESSAGES: Record<string, { text: string; tone: "ok" | "warn" | "wait" }> = {
  success: { text: "پرداخت با موفقیت انجام شد و سفارش شما در حال پردازش است.", tone: "ok" },
  processing: { text: "پرداخت شما در حال بررسی است. چند لحظه بعد صفحه را تازه کنید.", tone: "wait" },
  failed: { text: "پرداخت تأیید نشد. اگر مبلغی از حساب شما کسر شده، شماره سفارش را برای پشتیبانی ارسال کنید.", tone: "warn" },
  cancelled: { text: "پرداخت لغو شد. سفارش شما هنوز پرداخت نشده است.", tone: "warn" },
};

const TONES = {
  ok: "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20",
  warn: "text-brand-zard bg-brand-zard/10 border-brand-zard/20",
  wait: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
};

export default function PaymentResultBanner() {
  const searchParams = useSearchParams();
  const result = searchParams.get("payment");
  const order = searchParams.get("order");
  const message = result ? MESSAGES[result] : undefined;

  if (!message) return null;

  const Icon = message.tone === "ok" ? CheckCircle2 : message.tone === "wait" ? Clock : AlertTriangle;

  return (
    <div className={`mb-6 flex items-start gap-2 border p-3 text-xs leading-6 ${TONES[message.tone]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>
        {message.text}
        {order ? ` (سفارش #${Number(order).toLocaleString("fa-IR")})` : ""}
      </span>
    </div>
  );
}