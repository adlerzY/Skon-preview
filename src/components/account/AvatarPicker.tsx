"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";

export default function AvatarPicker({ currentAvatar }: { currentAvatar?: string | null }) {
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selected, setSelected] = useState(currentAvatar ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/avatars")
      .then((r) => r.json())
      .then((d) => setAvatars(d?.avatars ?? []))
      .finally(() => setIsFetching(false));
  }, []);

  const handleSelect = async (avatarPath: string) => {
    setSelected(avatarPath);
    setIsSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarPath }),
      });
      if (!res.ok) throw new Error();
      setMessage("عکس پروفایل بروزرسانی شد");
    } catch {
      setMessage("خطا در ذخیره‌سازی");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold text-brand-surface_m">انتخاب عکس پروفایل</span>

      {isFetching ? (
        <span className="text-[11px] text-brand-m_khonsa flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> در حال بارگذاری آواتارها...
        </span>
      ) : avatars.length === 0 ? (
        <span className="text-[11px] text-brand-m_khonsa">
          هنوز هیچ آواتاری در public/avatars قرار نگرفته است.
        </span>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
          {avatars.map((avatar) => (
            <button key={avatar} type="button" onClick={() => handleSelect(avatar)}
              className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${selected === avatar ? "border-brand-blue" : "border-transparent hover:border-brand-surface_hover"}`}>
              <Image src={avatar} alt="avatar" fill className="object-cover" sizes="56px" />
              {selected === avatar && <span className="absolute inset-0 bg-brand-blue/40 flex items-center justify-center"><Check size={18} className="text-white" /></span>}
            </button>
          ))}
        </div>
      )}

      {isSaving && <span className="text-[11px] text-brand-m_khonsa flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> در حال ذخیره...</span>}
      {message && !isSaving && <span className="text-[11px] text-brand-sabz">{message}</span>}
    </div>
  );
}