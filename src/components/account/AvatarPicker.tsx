"use client";

import { useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import UserAvatar from "@/components/ui/UserAvatar";
import Modal from "@/components/ui/Modal";

interface AvatarPickerProps {
  currentAvatar?: string | null;
  name?: string | null;
}

export default function AvatarPicker({ currentAvatar, name }: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [selected, setSelected] = useState(currentAvatar ?? "");
  const [pendingSelection, setPendingSelection] = useState(currentAvatar ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const openPicker = async () => {
    setIsOpen(true);
    setMessage("");
    setPendingSelection(selected);
    if (avatars.length > 0) return;
    setIsFetching(true);
    try {
      const res = await fetch("/api/avatars");
      const data = await res.json();
      setAvatars(data?.avatars ?? []);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!pendingSelection || pendingSelection === selected) {
      setIsOpen(false);
      return;
    }
    setIsSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarPath: pendingSelection }),
      });
      if (!res.ok) throw new Error();
      setSelected(pendingSelection);
      setMessage("عکس پروفایل بروزرسانی شد");
      setIsOpen(false);
    } catch {
      setMessage("خطا در ذخیره‌سازی");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <button type="button" onClick={openPicker} className="relative group shrink-0" aria-label="تغییر عکس پروفایل">
        <UserAvatar src={selected} name={name} size="xl" ring />
        <span className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera size={22} className="text-white" />
        </span>
      </button>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-white">عکس پروفایل</span>
        <span className="text-xs text-brand-m_khonsa max-w-[220px] leading-relaxed">
          این عکس در داشبورد، هدر سایت و نظرات شما نمایش داده می‌شود.
        </span>
        <button
          type="button"
          onClick={openPicker}
          className="mt-1 self-start text-xs font-bold text-brand-blue hover:text-white border border-brand-blue/30 hover:bg-brand-blue px-3 py-1.5 transition-colors"
        >
          انتخاب عکس جدید
        </button>
        {message && <span className="text-[11px] text-brand-sabz">{message}</span>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="انتخاب عکس پروفایل">
        {isFetching ? (
          <div className="flex items-center justify-center py-10 gap-2 text-brand-m_khonsa text-sm">
            <Loader2 size={16} className="animate-spin" /> در حال بارگذاری...
          </div>
        ) : avatars.length === 0 ? (
          <div className="text-center py-10 text-sm text-brand-m_khonsa">
            هنوز هیچ آواتاری در public/avatars قرار نگرفته است.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
              {avatars.map((avatar) => {
                const isSelected = pendingSelection === avatar;
                return (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setPendingSelection(avatar)}
                    className={`relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 transition-all duration-150 hover:scale-105 ${
                      isSelected ? "border-brand-blue shadow-[0_0_0_4px_rgba(0,116,224,0.2)]" : "border-transparent hover:border-brand-surface_hover"
                    }`}
                  >
                    <Image src={avatar} alt="avatar" fill className="object-cover" sizes="64px" />
                    {isSelected && (
                      <span className="absolute inset-0 bg-brand-blue/40 flex items-center justify-center">
                        <Check size={20} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-6 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}