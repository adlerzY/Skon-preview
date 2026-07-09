import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AvatarPicker from "@/components/account/AvatarPicker";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-black text-white mb-1">تنظیمات حساب</h1>
        <p className="text-sm text-brand-m_khonsa">مدیریت اطلاعات نمایشی حساب کاربری شما</p>
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-4">
        <span className="text-xs font-bold text-brand-surface_m">اطلاعات حساب</span>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between border-b border-brand-surface_hover pb-2">
            <span className="text-brand-m_khonsa">نام</span>
            <span className="text-white font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-m_khonsa">ایمیل</span>
            <span className="text-white font-medium" dir="ltr">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-6">
        <AvatarPicker currentAvatar={user.avatarUrl} />
      </div>
    </div>
  );
}