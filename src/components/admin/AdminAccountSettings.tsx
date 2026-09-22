"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, MonitorSmartphone, ShieldCheck, UserRound, Wrench, Loader2 } from "lucide-react";
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
 const [data,setData]=useState<SettingsData|null>(initial ?? null),[error,setError]=useState(""),[maintenance,setMaintenance]=useState<boolean|null>(null),[maintenanceBusy,setMaintenanceBusy]=useState(false),[maintenanceError,setMaintenanceError]=useState("");
 useEffect(()=>{if(initial)return;fetch("/api/admin/account-settings",{cache:"no-store"}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body?.error||"خطا در دریافت تنظیمات حساب");setData(body)}).catch(e=>setError(e instanceof Error?e.message:"خطا در دریافت تنظیمات حساب"))},[initial]);
 useEffect(()=>{fetch("/api/admin/maintenance",{cache:"no-store"}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body?.error||"خطا در دریافت وضعیت تعمیرات");setMaintenance(Boolean(body.enabled))}).catch(e=>setMaintenanceError(e instanceof Error?e.message:"خطا در دریافت وضعیت تعمیرات"))},[]);
 const toggleMaintenance=async()=>{if(maintenance===null||maintenanceBusy)return;setMaintenanceBusy(true);setMaintenanceError("");try{const r=await fetch("/api/admin/maintenance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:!maintenance})});const body=await r.json().catch(()=>null);if(!r.ok)throw new Error(body?.error||"تغییر وضعیت تعمیرات انجام نشد");setMaintenance(Boolean(body.enabled))}catch(e){setMaintenanceError(e instanceof Error?e.message:"تغییر وضعیت انجام نشد")}finally{setMaintenanceBusy(false)}};
 return <AdminPage className="max-w-none">
  <AdminPageIntro eyebrow="حساب مدیریت" title="تنظیمات پروفایل" description="اطلاعات حساب، امنیت و نشست‌ها را بدون خروج از پنل مدیریت کنترل کن."/>
  {error&&<div className="mb-4 rounded-[5px] border border-red-400/20 bg-red-500/5 p-4 text-xs text-red-300">{error}</div>}
  <AdminCard className="mb-4 overflow-hidden">
   <div className="flex items-center justify-between gap-4 border-b border-white/[.06] p-4">
    <div className="flex items-center gap-3">
     <span className={`flex h-9 w-9 items-center justify-center rounded-[5px] ${maintenance ? "bg-brand-zard/10 text-brand-zard" : "bg-emerald-400/10 text-emerald-300"}`}><Wrench size={17}/></span>
     <div><h2 className="text-sm font-black text-white">حالت تعمیرات سایت</h2><p className="mt-1 text-[10px] text-brand-m_khonsa">موقتاً همه صفحات فروشگاه را برای کاربران عادی می‌بندد؛ ادمین همچنان دسترسی دارد.</p></div>
    </div>
    <button type="button" onClick={toggleMaintenance} disabled={maintenance===null||maintenanceBusy} className={`relative h-8 w-14 rounded-full border transition-colors disabled:opacity-50 ${maintenance ? "bg-brand-zard/80 border-brand-zard" : "bg-brand-bg border-white/10"}`} aria-pressed={maintenance===true}>
      <span className={`absolute right-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${maintenance ? "-translate-x-6" : "translate-x-0"}`} />
      {maintenanceBusy && <Loader2 size={13} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-menu animate-spin" />}
    </button>
   </div>
   <div className="p-4">
    {maintenanceError && <div className="mb-3 rounded-[5px] border border-red-400/20 bg-red-500/5 p-3 text-xs text-red-300">{maintenanceError}</div>}
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-brand-m_khonsa">
      <span className={`rounded-full border px-2.5 py-1 font-bold ${maintenance ? "border-brand-zard/20 bg-brand-zard/10 text-brand-zard" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"}`}>{maintenance ? "فعال" : "خاموش"}</span>
      <span>{maintenance ? "کاربران عادی صفحه تعمیرات را می‌بینند." : "سایت در حالت عادی قابل مشاهده است."}</span>
    </div>
   </div>
  </AdminCard>
  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
   <AdminCard className="overflow-hidden"><div className="flex items-center gap-3 border-b border-white/[.06] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-brand-blue/10 text-brand-blue"><UserRound size={17}/></span><div><h2 className="text-sm font-black text-white">اطلاعات پروفایل</h2><p className="mt-1 text-[10px] text-brand-m_khonsa">نام و تصویر حساب مدیریت</p></div></div><div className="p-4">{!data?<AdminEmpty title="اطلاعات حساب در حال بارگذاری است."/>:<><AvatarPicker currentAvatarId={data.user.avatarId} currentAvatarUrl={data.user.avatarUrl} name={data.user.name} isStaff={data.user.isStaff}/><div className="mt-5 border-t border-white/[.06] pt-5"><ProfileEditForm name={data.user.name} email={data.user.email}/></div></>}</div></AdminCard>
   <AdminCard className="overflow-hidden"><div className="flex items-center gap-3 border-b border-white/[.06] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-emerald-400/10 text-emerald-300"><ShieldCheck size={17}/></span><div><h2 className="text-sm font-black text-white">امنیت</h2><p className="mt-1 text-[10px] text-brand-m_khonsa">رمز عبور و دسترسی حساب</p></div></div><div className="p-4">{!data?<AdminEmpty title="امنیت حساب در حال بارگذاری است."/>:<SetPasswordForm hasManualPassword={data.user.hasManualPassword}/>}</div></AdminCard>
  </div>
  <AdminCard className="mt-4 overflow-hidden"><div className="flex items-center gap-3 border-b border-white/[.06] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-white/[.04] text-brand-m_khonsa"><MonitorSmartphone size={17}/></span><div><h2 className="text-sm font-black text-white">نشست‌های فعال</h2><p className="mt-1 text-[10px] text-brand-m_khonsa">دستگاه‌هایی که به این حساب متصل‌اند.</p></div></div><div className="p-4">{!data?<AdminEmpty title="نشست‌ها در حال بارگذاری است."/>:<SessionsList sessions={data.sessions} currentSessionId={data.currentSessionId}/>}</div></AdminCard>
  <div className="mt-3 flex items-center gap-2 text-[10px] text-brand-m_khonsa"><LockKeyhole size={13}/> تنظیمات حساب مدیریت کاملاً جدا از حساب کاربری فروشگاه است.</div>
 </AdminPage>
}
