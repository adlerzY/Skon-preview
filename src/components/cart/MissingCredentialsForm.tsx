"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/context/CartContext";
import { AlertTriangle } from "lucide-react";
import { BATTLETAG_REGEX, EMAIL_REGEX } from "@/components/product/validation";

export default function MissingCredentialsForm({ item }: { item: CartItem }) {
  const { updateCredentials } = useCart();
  const [email, setEmail] = useState(item.customFields?.email ?? "");
  const [password, setPassword] = useState("");
  const [battleTag, setBattleTag] = useState(item.customFields?.battleTag ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    if (item.deliveryMethod === "direct") {
      if (!EMAIL_REGEX.test(email.trim())) {
        setError("ایمیل اکانت معتبر نیست");
        return;
      }
      if (!password.trim()) {
        setError("پسورد اکانت را وارد کنید");
        return;
      }
      updateCredentials(item.id, { email: email.trim(), password });
    } else if (item.deliveryMethod === "gift") {
      if (!BATTLETAG_REGEX.test(battleTag.trim())) {
        setError("فرمت بتل‌تگ نامعتبر است. مثال: Name#1234");
        return;
      }
      updateCredentials(item.id, { battleTag: battleTag.trim() });
    }
  };

  return (
    <div className="mt-3 bg-brand-zard/10 border border-brand-zard/30 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-brand-zard text-xs font-bold">
        <AlertTriangle size={14} />
        اطلاعات ورود این آیتم کامل نیست — لطفاً تکمیل کنید
      </div>
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
      {item.deliveryMethod === "direct" ? (
        <div className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ایمیل اکانت"
            dir="ltr"
            className="bg-brand-bg border border-brand-surface_hover p-2.5 text-sm text-brand-active focus:outline-none focus:border-brand-blue text-left"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="پسورد اکانت"
            dir="ltr"
            autoComplete="new-password"
            className="bg-brand-bg border border-brand-surface_hover p-2.5 text-sm text-brand-active focus:outline-none focus:border-brand-blue text-left"
          />
        </div>
      ) : (
        <input
          type="text"
          value={battleTag}
          onChange={(e) => setBattleTag(e.target.value)}
          placeholder="BattleTag#1234"
          dir="ltr"
          className="bg-brand-bg border border-brand-surface_hover p-2.5 text-sm text-brand-active focus:outline-none focus:border-brand-blue text-left font-mono"
        />
      )}
      <button
        type="button"
        onClick={handleSave}
        className="self-start bg-brand-blue hover:bg-[#0062d1] text-white text-xs font-bold px-4 py-2 transition-colors"
      >
        ذخیره اطلاعات
      </button>
    </div>
  );
}