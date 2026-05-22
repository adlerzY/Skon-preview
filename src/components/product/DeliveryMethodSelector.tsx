// src/components/product/DeliveryMethodSelector.tsx
'use client';

import React, { useState, useEffect } from 'react';

export type DeliveryMethod = 'direct' | 'gift' | 'code';

interface DeliveryMethodSelectorProps {
  prices: {
    direct: number;
    gift: number | 'disabled';
    code: number | 'disabled';
  };
  onMethodChange: (method: DeliveryMethod, finalPrice: number) => void;
}

export default function DeliveryMethodSelector({ prices, onMethodChange }: DeliveryMethodSelectorProps) {
  const isDirectAvailable = prices.direct > 0;
  const isGiftAvailable = prices.gift !== 'disabled';
  const isCodeAvailable = prices.code !== 'disabled';

  // انتخاب اولین متد معتبر در دسترس
  const getFallbackMethod = (): DeliveryMethod => {
    if (isDirectAvailable) return 'direct';
    if (isGiftAvailable) return 'gift';
    return 'code';
  };

  const [activeMethod, setActiveMethod] = useState<DeliveryMethod>(getFallbackMethod());

  // همگام‌سازی وضعیت انتخاب در صورت سوئیچ متغیرها در کامپوننت والد
  useEffect(() => {
    if (activeMethod === 'direct' && !isDirectAvailable) setActiveMethod(getFallbackMethod());
    if (activeMethod === 'gift' && !isGiftAvailable) setActiveMethod(getFallbackMethod());
    if (activeMethod === 'code' && !isCodeAvailable) setActiveMethod(getFallbackMethod());
    
    // کانتکست والد را از قیمت روش فعال جدید مطلع کن
    const currentPrice = activeMethod === 'direct' ? prices.direct : (prices[activeMethod] as number);
    onMethodChange(activeMethod, currentPrice || 0);
  }, [prices, activeMethod]);

  const handleSelect = (method: DeliveryMethod) => {
    setActiveMethod(method);
    const price = method === 'direct' ? prices.direct : (prices[method] as number);
    onMethodChange(method, price);
  };

  return (
    <div className="w-full space-y-4 text-right" dir="rtl">
      <label className="text-sm font-semibold text-zinc-400 block">۳. روش تحویل را انتخاب کنید:</label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* دکمه خرید مستقیم */}
        {isDirectAvailable && (
          <button
            type="button"
            onClick={() => handleSelect('direct')}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between h-24 ${
              activeMethod === 'direct'
                ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <span className={`text-sm font-bold ${activeMethod === 'direct' ? 'text-blue-400' : 'text-zinc-200'}`}>
              خرید مستقیم روی اکانت
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {prices.direct.toLocaleString('fa-IR')} تومان
            </span>
          </button>
        )}

        {/* دکمه گیفت */}
        {isGiftAvailable && (
          <button
            type="button"
            onClick={() => handleSelect('gift')}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between h-24 ${
              activeMethod === 'gift'
                ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <span className={`text-sm font-bold ${activeMethod === 'gift' ? 'text-blue-400' : 'text-zinc-200'}`}>
              ارسال به صورت گیفت (Gift)
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {(prices.gift as number).toLocaleString('fa-IR')} تومان
            </span>
          </button>
        )}

        {/* دکمه کد لایسنس */}
        {isCodeAvailable && (
          <button
            type="button"
            onClick={() => handleSelect('code')}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between h-24 ${
              activeMethod === 'code'
                ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <span className={`text-sm font-bold ${activeMethod === 'code' ? 'text-blue-400' : 'text-zinc-200'}`}>
              دریافت کد دیجیتال (Key)
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {(prices.code as number).toLocaleString('fa-IR')} تومان
            </span>
          </button>
        )}
      </div>

      {/* باکس کاندیشنال فیلدها */}
      <div className="mt-6 bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/60 min-h-[100px] flex flex-col justify-center">
        {activeMethod === 'direct' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <p className="text-xs text-amber-400 font-medium">⚠️ جهت فعال‌سازی مستقیم، فیلدهای زیر الزامی هستند:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="email" name="account_email" placeholder="ایمیل اکانت" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
              <input type="password" name="account_password" placeholder="رمز عبور اکانت" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        )}

        {activeMethod === 'gift' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <p className="text-xs text-blue-400 font-medium">💡 لطفاً بتل‌تگ خود را جهت بررسی لیست فرندها وارد کنید:</p>
            <div className="flex gap-3">
              <input type="text" name="battletag" placeholder="Example#1234" required className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 tracking-wider" />
              <button type="button" className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 px-4 rounded-lg border border-zinc-700 transition-colors">بررسی لایو</button>
            </div>
          </div>
        )}

        {activeMethod === 'code' && (
          <div className="animate-in fade-in duration-200 text-center py-2">
            <p className="text-sm text-emerald-400 font-medium">✓ لایسنس دیجیتال بلافاصله پس از پرداخت پیامک و ایمیل خواهد شد.</p>
          </div>
        )}
      </div>
    </div>
  );
}