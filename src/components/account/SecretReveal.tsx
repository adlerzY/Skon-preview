"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SecretReveal({ orderId, itemId }: { orderId: number; itemId: number }) {
  const [value, setValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleReveal = async () => {
    if (value) { setValue(null); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/reveal-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, itemId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "خطا در دریافت کد"); return; }
      setValue(data.value);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button onClick={handleReveal} disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white border border-brand-blue/30 hover:bg-brand-blue px-3 py-2 transition-colors disabled:opacity-50">
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : value ? <EyeOff size={14} /> : <Eye size={14} />}
          {value ? "پنهان کردن کد" : "نمایش کد"}
        </button>
        {value && (
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-sabz hover:text-white border border-brand-sabz/30 hover:bg-brand-sabz px-3 py-2 transition-colors">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "کپی شد" : "کپی"}
          </button>
        )}
      </div>
      {value && (
        <code dir="ltr" className="bg-brand-bg border border-brand-surface_hover px-3 py-2 text-sm text-brand-active font-mono tracking-wider select-all">
          {value}
        </code>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}