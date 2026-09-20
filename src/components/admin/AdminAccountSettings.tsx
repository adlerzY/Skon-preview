"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, MonitorSmartphone, ShieldCheck, UserRound } from "lucide-react";
import AvatarPicker from "@/components/account/AvatarPicker";
import ProfileEditForm from "@/components/account/ProfileEditForm";
import SetPasswordForm from "@/components/account/SetPasswordForm";
import SessionsList from "@/components/account/SessionsList";
import { AdminCard, AdminEmpty, AdminPage, AdminPageIntro } from "./AdminUi";

interface SettingsData {
  user: { avatarId:string|null; avatarUrl:string|null; name:string; email:string; isStaff:boolean; hasManualPassword:boolean };
  sessions:Array<{sessionId:string;deviceLabel?:string;ipAddress?:string;lastActive?:string;createdAt?:string}>;
  currentSessionId:string|null;
}

export default function AdminAccountSettings({ initial }: { initial?: SettingsData }){
 const [data,setData]=useState<SettingsData|null>(initial ?? null),[error,setError]=useState("");
 useEffect(()=>{if(initial)return;fetch("/api/admin/account-settings",{cache:"no-store"}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body?.error||"خطا در دریافت تنظیمات حساب");setData(body)}).catch(e=>setError(e instanceof Error?e.message:"خطا در دریافت تنظیمات حساب"))},[initial]);
 return <AdminPage className="max-w-none">
  <AdminPageIntro eyebrow="حساب مدیریت" title="تنظیمات پروفایل" description="اطلاعات حساب، امنیت و نشست‌ها را بدون خروج از پنل مدیریت کنترل کن."/>
  {error&&<div className="mb-4 rounded-[5px] border border-red-400/20 bg-red-500/5 p-4 text-xs text-red-300">{error}</div>}
  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
   <AdminCard className="overflow-hidden"><div className="flex items-center gap-3 border-b border-white/[.06] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-brand-blue/10 text-brand-blue"><UserRound size={17}/></span><div><h2 className="text-sm font-black text-white">اطلاعات پروفایل</h2><p className="mt-1 text-[10px] text-brand-m_khonsa">نام و تصویر حساب مدیریت</p></div></div><div className="p-4">{!data?<AdminEmpty title="اطلاعات حساب در حال بارگذاری است."/>:<><AvatarPicker currentAvatarId={data.user.avatarId} currentAvatarUrl={data.user.avatarUrl} name={data.user.name} isStaff={data.user.isStaff}/><div className="mt-5 border-t border-white/[.06] pt-5"><ProfileEditForm name={data.user.name} email={data.user.email}/></div></>}</div></AdminCard>
   <AdminCard className="overflow-hidden"><div className="flex items-center gap-3 border-b border-white/[.06] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-emerald-400/10 text-emerald-300"><ShieldCheck size={17}/></span><div><h2 className="text-sm font-black text-white">امنیت</h2><p className="mt-1 text-[10px] text-brand-m_khonsa">رمز عبور و دسترسی حساب</p></div></div><div className="p-4">{!data?<AdminEmpty title="امنیت حساب در حال بارگذاری است."/>:<SetPasswordForm hasManualPassword={data.user.hasManualPassword}/>}</div></AdminCard>
  </div>
  <AdminCard className="mt-4 overflow-hidden"><div className="flex items-center gap-3 border-b border-white/[.06] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-white/[.04] text-brand-m_khonsa"><MonitorSmartphone size={17}/></span><div><h2 className="text-sm font-black text-white">نشست‌های فعال</h2><p className="mt-1 text-[10px] text-brand-m_khonsa">دستگاه‌هایی که به این حساب متصل‌اند.</p></div></div><div className="p-4">{!data?<AdminEmpty title="نشست‌ها در حال بارگذاری است."/>:<SessionsList sessions={data.sessions} currentSessionId={data.currentSessionId}/>}</div></AdminCard>
  <div className="mt-3 flex items-center gap-2 text-[10px] text-brand-m_khonsa"><LockKeyhole size={13}/> تنظیمات حساب مدیریت کاملاً جدا از حساب کاربری فروشگاه است.</div>
 </AdminPage>
}
