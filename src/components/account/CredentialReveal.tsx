"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff, Loader2 } from "lucide-react";

const LABELS: Record<string, string> = {
  email: "ایمیل اکانت",
  password: "پسورد اکانت",
  battletag: "بتل‌تگ",
};

export default function CredentialReveal({
  orderId,
  itemId,
  deliveryMethod,
}: {
  orderId: number;
  itemId: number;
  deliveryMethod: "direct" | "gift";
}) {
  const [fields, setFields] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fieldTypes = deliveryMethod === "direct" ? ["email", "password"] : ["battletag"];

  const handleReveal = async () => {
    if (fields) {
      setFields(null);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/reveal-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, itemId, fieldTypes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "خطا در دریافت اطلاعات");
        return;
      }
      setFields(data.fields);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleReveal}
        disabled={isLoading}
        className="self-start flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white border border-brand-blue/30 hover:bg-brand-blue px-3 py-2 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : fields ? <EyeOff size={14} /> : <Eye size={14} />}
        {fields ? "پنهان کردن اطلاعات" : "نمایش اطلاعاتی که ثبت کردید"}
      </button>

      {fields && (
        <div className="flex flex-col gap-1.5">
          {Object.entries(fields).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[11px] text-brand-m_khonsa shrink-0 w-16">{LABELS[key] || key}</span>
              <code dir="ltr" className="bg-brand-bg border border-brand-surface_hover px-3 py-2 text-sm text-brand-active font-mono tracking-wider select-all flex-1 truncate">
                {value}
              </code>
              <button
                onClick={() => handleCopy(key, value)}
                className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-brand-sabz hover:text-white border border-brand-sabz/30 hover:bg-brand-sabz px-3 py-2 transition-colors"
              >
                {copiedKey === key ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey === key ? "کپی شد" : "کپی"}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}