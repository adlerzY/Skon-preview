import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AvatarPicker from "@/components/account/AvatarPicker";
import ProfileEditForm from "@/components/account/ProfileEditForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-white mb-1">تنظیمات حساب</h1>
        <p className="text-sm text-brand-m_khonsa">مدیریت اطلاعات نمایشی و عکس پروفایل حساب کاربری شما</p>
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-6">
        <AvatarPicker currentAvatar={user.avatarUrl} name={user.name} />
        <div className="border-t border-brand-surface_hover pt-6">
          <ProfileEditForm name={user.name} email={user.email} />
        </div>
      </div>
    </div>
  );
}