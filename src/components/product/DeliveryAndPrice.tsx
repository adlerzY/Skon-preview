"use client";

import { useState, type ReactNode } from "react";
import { User, Gift, FileCheck, Eye, EyeOff, ClipboardPaste } from "lucide-react";
import type { VariationCard } from "@/lib/graphql";
import { PriceDisplay } from "./PriceDisplay";
import { useToast } from "@/context/ToastContext";
import {
  DELIVERY_LABELS,
  type DeliveryOptionState,
  type DeliveryType,
  type ProductPurchaseState,
} from "./useProductDelivery";
import { BATTLETAG_REGEX } from "./validation";

interface DeliveryMeta {
  summary: string;
  requirement: string;
  formTitle: string;
  formHint: string;
  icon: ReactNode;
  selected: string;
  iconWrap: string;
  radio: string;
}

const DELIVERY_META: Record<DeliveryType, DeliveryMeta> = {
  direct: {
    summary: "سریع‌ترین حالت فعال‌سازی",
    requirement: "نیازمند ایمیل و رمز عبور اکانت شما",
    formTitle: "اطلاعات ورود اکانت",
    formHint:
      "برای فعال‌سازی مستقیم، ایمیل و رمز عبور اکانت را وارد کنید. اطلاعات رمزنگاری‌شده ذخیره می‌شود و پس از تکمیل سفارش حذف می‌گردد.",
    icon: <User size={20} strokeWidth={2} />,
    selected: "border-brand-blue bg-brand-blue/10",
    iconWrap: "border-brand-blue/30 bg-brand-blue/10 text-brand-blue",
    radio: "border-brand-blue text-brand-blue",
  },
  gift: {
    summary: "ارسال به دوستان",
    requirement: "نیازمند BattleTag و گذشت ۳ روز از ادد فرند بودن",
    formTitle: "اطلاعات دریافت گیفت",
    formHint: "گیفت به BattleTag شما ارسال می‌شود و نیازمند گذشت ۳ روز از ادد فرند بودن است.",
    icon: <Gift size={20} strokeWidth={2} />,
    selected: "border-brand-zard bg-brand-zard/10",
    iconWrap: "border-brand-zard/30 bg-brand-zard/10 text-brand-zard",
    radio: "border-brand-zard text-brand-zard",
  },
  code: {
    summary: "تحویل در لحظه",
    requirement: "بدون نیاز به اطلاعات ورود اکانت؛ کد پس از پرداخت در پنل کاربری نمایش داده می‌شود",
    formTitle: "دریافت کد اصلی",
    formHint: "برای این روش نیازی به ثبت اطلاعات اضافی نیست.",
    icon: <FileCheck size={20} strokeWidth={2} />,
    selected: "border-brand-sabz bg-brand-sabz/10",
    iconWrap: "border-brand-sabz/30 bg-brand-sabz/10 text-brand-sabz",
    radio: "border-brand-sabz text-brand-sabz",
  },
};

function discountPercent(price: number | null, regular: number | null): number {
  if (typeof price !== "number" || typeof regular !== "number" || regular <= 0 || regular <= price) return 0;
  return Math.round(((regular - price) / regular) * 100);
}

function stockLabel(count: number | null): { text: string; low: boolean } | null {
  if (count == null || count <= 0) return null;
  if (count <= 5) return { text: `فقط ${count.toLocaleString("fa-IR")} عدد باقی مانده`, low: true };
  return { text: "موجود", low: false };
}

function DirectForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const pasteInto = async (setter: (v: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setter(text.trim());
    } catch {
      showToast("دسترسی به کلیپ‌بورد امکان‌پذیر نیست.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="ایمیل اکانت"
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 pl-10 text-base md:text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
          dir="ltr"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          type="button"
          onClick={() => pasteInto(onEmailChange)}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-m_khonsa hover:text-brand-blue transition-colors p-1"
          aria-label="چسباندن ایمیل"
          tabIndex={-1}
        >
          <ClipboardPaste size={15} />
        </button>
      </div>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="پسورد اکانت"
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 pl-16 text-base md:text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
          dir="ltr"
          autoComplete="new-password"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => pasteInto(onPasswordChange)}
            className="text-brand-m_khonsa hover:text-brand-blue transition-colors p-1"
            aria-label="چسباندن پسورد"
            tabIndex={-1}
          >
            <ClipboardPaste size={15} />
          </button>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-brand-m_khonsa hover:text-brand-blue transition-colors p-1"
            aria-label={showPassword ? "مخفی کردن پسورد" : "نمایش پسورد"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function GiftForm({
  battleTag,
  onBattleTagChange,
}: {
  battleTag: string;
  onBattleTagChange: (v: string) => void;
}) {
  const { showToast } = useToast();

  const pasteBattleTag = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onBattleTagChange(text.trim());
    } catch {
      showToast("دسترسی به کلیپ‌بورد امکان‌پذیر نیست.");
    }
  };

  const trimmed = battleTag.trim();
  const showError = trimmed.length > 0 && !BATTLETAG_REGEX.test(trimmed);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-brand-zard font-bold">
        💡 بتل‌تگ خود را جهت ارسال گیفت وارد کنید:
      </p>
      <div className="relative">
        <input
          type="text"
          value={battleTag}
          onChange={(e) => onBattleTagChange(e.target.value)}
          placeholder="BattleTag#1234"
          className="w-full bg-brand-bg border border-brand-surface_hover p-4 pl-10 text-base md:text-sm text-brand-active focus:outline-none focus:border-brand-zard font-mono text-left"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={pasteBattleTag}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-m_khonsa hover:text-brand-zard transition-colors p-1"
          aria-label="چسباندن بتل‌تگ"
          tabIndex={-1}
        >
          <ClipboardPaste size={15} />
        </button>
      </div>
      {showError && (
        <span className="text-xs text-red-500 font-medium">
          ⚠️ فرمت بتل‌تگ نامعتبر است. مثال: Name#1234
        </span>
      )}
    </div>
  );
}

function CodeInfo({ stock }: { stock: { text: string; low: boolean } | null }) {
  return (
    <div className="py-2 text-center flex flex-col items-center gap-2">
      <span className="text-3xl">🚀</span>
      <p className="text-xs text-brand-sabz font-bold leading-relaxed">
        کد اورجینال بلافاصله پس از پرداخت
        <br />
        در پنل کاربری نمایش داده می‌شود.
      </p>
      {stock && (
        <span
          className={`text-[11px] font-bold px-2.5 py-1 border ${
            stock.low
              ? "text-brand-zard bg-brand-zard/10 border-brand-zard/20"
              : "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20"
          }`}
        >
          {stock.text}
        </span>
      )}
    </div>
  );
}

function DeliveryCard({
  option,
  selected,
  onSelect,
}: {
  option: DeliveryOptionState;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = DELIVERY_META[option.type];
  const discount = discountPercent(option.price, option.regularPrice);
  const stock = option.type === "code" ? stockLabel(option.stockCount) : null;
  const dim = option.available ? "" : "opacity-50";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!option.available}
      onClick={onSelect}
      className={`w-full text-right border p-3.5 flex flex-col gap-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue/60 ${
        !option.available
          ? "cursor-not-allowed border-brand-surface_hover/50 bg-brand-surface/40"
          : selected
          ? `cursor-pointer ${meta.selected}`
          : "cursor-pointer border-brand-surface_hover bg-brand-surface hover:border-brand-m_khonsa"
      }`}
    >
      <div className={`flex items-center gap-3 ${dim}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${meta.iconWrap}`}>
          {meta.icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-bold text-brand-active">{DELIVERY_LABELS[option.type]}</span>
          <span className="text-[11px] leading-5 text-brand-m_khonsa">{meta.summary}</span>
        </div>
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? meta.radio : "border-brand-surface_m text-transparent"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      </div>

      <p className={`text-[11px] leading-5 text-brand-m_khonsa ${dim}`}>{meta.requirement}</p>

      <div className="flex items-center justify-between gap-2 border-t border-brand-surface_hover pt-2.5">
        {option.available ? (
          <>
            <span className="flex flex-wrap items-center gap-1.5">
              {discount > 0 && (
                <span className="bg-brand-sabz px-1.5 py-0.5 text-[10px] font-black text-brand-bg">
                  {discount.toLocaleString("fa-IR")}٪ تخفیف
                </span>
              )}
              {stock && (
                <span className={`text-[11px] font-bold ${stock.low ? "text-brand-zard" : "text-brand-sabz"}`}>
                  {stock.text}
                </span>
              )}
            </span>
            <span className="ml-auto">
              <PriceDisplay price={option.price} regularPrice={option.regularPrice ?? undefined} compact />
            </span>
          </>
        ) : (
          <span className="text-[11px] font-bold text-red-500">{option.reason}</span>
        )}
      </div>
    </button>
  );
}

function DeliveryChoice({
  selectedVariation,
  purchase,
}: {
  selectedVariation: VariationCard;
  purchase: ProductPurchaseState;
}) {
  const { options, deliveryType, setDeliveryType } = purchase;
  const anyAvailable = options.some((option) => option.available);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-brand-surface_m text-[13px] font-bold">مسیر تحویل محصول:</span>
        <span className="text-[11px] leading-5 text-brand-m_khonsa">
          قیمت هر روش برای مشخصات انتخاب‌شده نمایش داده شده است؛ یکی را انتخاب کنید.
        </span>
      </div>

      {selectedVariation.commissionDiscountBadge && (
        <div className="self-start bg-brand-sabz/10 border border-brand-sabz/40 text-brand-sabz px-3 py-1 text-xs font-bold">
          تخفیف ویژه فروشگاه
        </div>
      )}

      <div role="radiogroup" aria-label="روش تحویل" className="flex flex-col gap-2">
        {options.map((option) => (
          <DeliveryCard
            key={option.type}
            option={option}
            selected={deliveryType === option.type}
            onSelect={() => setDeliveryType(option.type)}
          />
        ))}
      </div>

      {!anyAvailable && (
        <p className="bg-brand-zard/10 border border-brand-zard/20 p-3 text-xs leading-6 text-brand-zard">
          برای مشخصات انتخاب‌شده هیچ روش تحویلی فعال نیست. نسخه دیگری را انتخاب کنید.
        </p>
      )}
    </div>
  );
}

function DeliveryDetails({ purchase }: { purchase: ProductPurchaseState }) {
  const { deliveryType, email, setEmail, password, setPassword, battleTag, setBattleTag, options } = purchase;

  if (!deliveryType) return null;

  const meta = DELIVERY_META[deliveryType];
  const option = options.find((item) => item.type === deliveryType);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-brand-surface_m text-[13px] font-bold">{meta.formTitle}</span>
        <span className="text-[11px] leading-5 text-brand-m_khonsa">{meta.formHint}</span>
      </div>

      <div
        key={deliveryType}
        className="bg-brand-surface p-2 border border-brand-surface_hover animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none"
      >
        {deliveryType === "direct" && (
          <DirectForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
          />
        )}
        {deliveryType === "gift" && <GiftForm battleTag={battleTag} onBattleTagChange={setBattleTag} />}
        {deliveryType === "code" && <CodeInfo stock={option ? stockLabel(option.stockCount) : null} />}
      </div>
    </div>
  );
}

interface DeliveryAndPriceProps {
  step: 2 | 3;
  selectedVariation: VariationCard;
  purchase: ProductPurchaseState;
}

export default function DeliveryAndPrice({ step, selectedVariation, purchase }: DeliveryAndPriceProps) {
  if (step === 2) {
    return <DeliveryChoice selectedVariation={selectedVariation} purchase={purchase} />;
  }
  return <DeliveryDetails purchase={purchase} />;
}