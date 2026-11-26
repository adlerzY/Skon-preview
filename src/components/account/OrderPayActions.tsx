"use client";

import { useEffect, useState } from "react";
import { Clock, CreditCard, Loader2, RotateCcw, ShoppingCart, XCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { MAX_CART_QUANTITY } from "@/lib/cartLimits";

export interface ReorderLine {
  productId: number;
  variationId?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  deliveryMethod: string;
  region?: string;
  variationName?: string;
}

interface OrderPayActionsProps {
  orderId: number;
  orderNumber: string;
  mode: string;
  deadline?: string | null;
  lines: ReorderLine[];
  onChanged?: () => void;
}

function useRemainingText(deadline?: string | null): string | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (!deadline || now === null) return null;
  const diff = new Date(deadline).getTime() - now;
  if (!Number.isFinite(diff)) return null;
  if (diff <= 0) return "";

  const totalMinutes = Math.max(1, Math.ceil(diff / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours.toLocaleString("fa-IR")} ساعت`);
  if (minutes > 0) parts.push(`${minutes.toLocaleString("fa-IR")} دقیقه`);
  return parts.join(" و ");
}

async function postOrder(url: string, orderId: number) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
}

export default function OrderPayActions({ orderId, orderNumber, mode, deadline, lines, onChanged }: OrderPayActionsProps) {
  const { showToast } = useToast();
  const { addToCart, totalQuantity } = useCart();
  const [busy, setBusy] = useState<"pay" | "cancel" | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reorderOnly, setReorderOnly] = useState(false);
  const remaining = useRemainingText(deadline);

  const effectiveMode = reorderOnly ? "reorder" : mode;

  const handlePay = async () => {
    if (busy) return;
    setBusy("pay");
    try {
      const { ok, data } = await postOrder("/api/account/orders/retry", orderId);
      if (!ok) {
        showToast(data?.error || "پرداخت مجدد انجام نشد", "error");
        if (mode === "reopen") setReorderOnly(true);
        setBusy(null);
        onChanged?.();
        return;
      }
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      showToast("پرداخت شما قبلاً تأیید شده و سفارش در حال تکمیل است", "success");
      setBusy(null);
      onChanged?.();
    } catch {
      showToast("خطا در ارتباط با سرور", "error");
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (busy) return;
    setBusy("cancel");
    try {
      const { ok, data } = await postOrder("/api/account/orders/cancel", orderId);
      if (!ok) {
        showToast(data?.error || "لغو سفارش انجام نشد", "error");
        return;
      }
      showToast("سفارش لغو شد");
      onChanged?.();
    } catch {
      showToast("خطا در ارتباط با سرور", "error");
    } finally {
      setBusy(null);
      setConfirmCancel(false);
    }
  };

  const handleReorder = () => {
    let room = MAX_CART_QUANTITY - totalQuantity;
    if (room <= 0) {
      showToast(`سبد خرید پر است (حداکثر ${MAX_CART_QUANTITY.toLocaleString("fa-IR")} عدد)`, "error");
      return;
    }

    let added = 0;
    for (const line of lines) {
      if (room <= 0) break;
      const quantity = Math.min(line.quantity, room);
      const ok = addToCart(
        {
          productId: line.productId,
          variationId: line.variationId || undefined,
          name: line.name,
          price: line.unitPrice,
          deliveryMethod: line.deliveryMethod,
          region: line.region,
          variationName: line.variationName,
        },
        quantity
      );
      if (ok) {
        added += quantity;
        room -= quantity;
      }
    }

    if (added === 0) return;
    showToast("اقلام سفارش به سبد اضافه شد؛ اطلاعات ورود را تکمیل کنید 🛒");
    window.setTimeout(() => {
      window.location.href = "/cart";
    }, 350);
  };

  const title =
    effectiveMode === "pay"
      ? `سفارش #${orderNumber} هنوز پرداخت نشده است`
      : effectiveMode === "reopen"
      ? `سفارش #${orderNumber} لغو شده؛ هنوز می‌توانید پرداخت را ادامه دهید`
      : `سفارش #${orderNumber} لغو شده؛ می‌توانید اقلام را دوباره به سبد اضافه کنید`;

  const deadlineText =
    remaining === null
      ? null
      : effectiveMode === "pay"
      ? remaining === ""
        ? "مهلت پرداخت رو به پایان است"
        : `لغو خودکار تا ${remaining} دیگر`
      : effectiveMode === "reopen"
      ? remaining === ""
        ? "فرصت ادامه پرداخت رو به پایان است"
        : `امکان ادامه پرداخت تا ${remaining} دیگر`
      : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-surface_hover bg-brand-bg/40 px-4 py-3 md:px-5">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-bold text-white">{title}</span>
        {deadlineText && (
          <span className="flex items-center gap-1 text-[11px] text-brand-m_khonsa">
            <Clock size={12} />
            {deadlineText}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(effectiveMode === "pay" || effectiveMode === "reopen") && (
          <button
            type="button"
            onClick={handlePay}
            disabled={busy !== null}
            className="flex items-center gap-1.5 bg-brand-blue px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0062d1] disabled:opacity-60"
          >
            {busy === "pay" ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
            {effectiveMode === "reopen" ? "ادامه پرداخت" : "پرداخت سفارش"}
          </button>
        )}

        {effectiveMode === "reorder" && (
          <button
            type="button"
            onClick={handleReorder}
            className="flex items-center gap-1.5 bg-brand-blue px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0062d1]"
          >
            <ShoppingCart size={14} />
            ثبت مجدد سفارش
          </button>
        )}

        {effectiveMode === "pay" &&
          (confirmCancel ? (
            <span className="flex items-center gap-2 text-[11px]">
              <span className="text-brand-m_khonsa">لغو سفارش؟</span>
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy !== null}
                className="flex items-center gap-1 font-bold text-red-500 hover:text-red-400 disabled:opacity-60"
              >
                {busy === "cancel" && <Loader2 size={12} className="animate-spin" />}
                بله
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={busy !== null}
                className="font-bold text-brand-m_khonsa hover:text-white"
              >
                خیر
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              disabled={busy !== null}
              className="flex items-center gap-1.5 border border-brand-surface_hover px-3 py-2 text-xs font-bold text-brand-m_khonsa transition-colors hover:text-white disabled:opacity-60"
            >
              <XCircle size={14} />
              لغو سفارش
            </button>
          ))}

        {effectiveMode === "reopen" && (
          <button
            type="button"
            onClick={() => setReorderOnly(true)}
            className="flex items-center gap-1.5 border border-brand-surface_hover px-3 py-2 text-xs font-bold text-brand-m_khonsa transition-colors hover:text-white"
          >
            <RotateCcw size={14} />
            ثبت مجدد
          </button>
        )}
      </div>
    </div>
  );
}