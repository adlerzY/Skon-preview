"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export type PaymentResult = "success" | "processing" | "failed" | "cancelled";

const MESSAGES: Record<PaymentResult, { text: string; tone: "ok" | "warn" | "wait" }> = {
  success: { text: "پرداخت با موفقیت انجام شد و سفارش شما در حال پردازش است.", tone: "ok" },
  processing: { text: "پرداخت شما در حال بررسی است؛ وضعیت سفارش به‌صورت خودکار به‌روز می‌شود.", tone: "wait" },
  failed: { text: "پرداخت تأیید نشد. اگر مبلغی کسر شده شماره سفارش را برای پشتیبانی بفرستید؛ در غیر این صورت از لیست پایین می‌توانید دوباره پرداخت کنید.", tone: "warn" },
  cancelled: { text: "پرداخت انجام نشد. سفارش شما هنوز پرداخت نشده و از همین صفحه می‌توانید دوباره پرداخت کنید.", tone: "warn" },
};

const TONES = {
  ok: "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20",
  warn: "text-brand-zard bg-brand-zard/10 border-brand-zard/20",
  wait: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
};

const POLL_MS = 5000;
const MAX_POLLS = 12;

export default function PaymentResultBanner({
  result,
  orderId,
  polling = false,
}: {
  result: PaymentResult;
  orderId?: number;
  polling?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!polling) return;
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= MAX_POLLS) window.clearInterval(timer);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [polling, router]);

  const message = MESSAGES[result];
  const Icon = message.tone === "ok" ? CheckCircle2 : message.tone === "wait" ? Clock : AlertTriangle;

  return (
    <div className={`mb-6 flex items-start gap-2 border p-3 text-xs leading-6 ${TONES[message.tone]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>
        {message.text}
        {orderId ? ` (سفارش #${orderId.toLocaleString("fa-IR")})` : ""}
      </span>
    </div>
  );
}
