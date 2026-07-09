"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface OrderOption {
  databaseId: number;
  orderNumber?: string;
  date?: string;
}

export default function NewTicketForm({ orders }: { orders: OrderOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkedOrderId, setLinkedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (title.trim().length < 3) {
      setError("عنوان تیکت را کامل‌تر وارد کنید");
      return;
    }
    if (content.trim().length < 5) {
      setError("متن تیکت را کامل‌تر وارد کنید");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          linkedOrderId: linkedOrderId ? Number(linkedOrderId) : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "ثبت تیکت با خطا مواجه شد");
        return;
      }

      router.push("/my-account/tickets");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-4">
      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">عنوان تیکت</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
          placeholder="مثلاً مشکل در دریافت کد سفارش"
        />
      </div>

      {orders.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-brand-surface_m">سفارش مرتبط (اختیاری)</label>
          <select
            value={linkedOrderId}
            onChange={(e) => setLinkedOrderId(e.target.value)}
            className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue"
          >
            <option value="">بدون سفارش مرتبط</option>
            {orders.map((order) => (
              <option key={order.databaseId} value={order.databaseId}>
                سفارش #{order.orderNumber || order.databaseId}
                {order.date ? ` — ${new Date(order.date).toLocaleDateString("fa-IR")}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">توضیحات</label>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors resize-none"
          placeholder="مشکل خود را با جزئیات توضیح دهید..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? "در حال ارسال..." : "ارسال تیکت"}
      </button>
    </form>
  );
}