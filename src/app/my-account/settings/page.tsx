import { redirect } from "next/navigation";
import { getAuthToken, getCurrentUser, getSessionId } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { GET_SESSIONS_QUERY } from "@/lib/graphql/auth";
import AvatarPicker from "@/components/account/AvatarPicker";
import ProfileEditForm from "@/components/account/ProfileEditForm";
import SessionsList from "@/components/account/SessionsList";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  const token = await getAuthToken();
  const currentSessionId = await getSessionId();
  const data = await fetchGraphQL(GET_SESSIONS_QUERY, {}, [], "no-store", token || undefined);
  const sessions = data?.viewer?.sessions ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-white mb-1">تنظیمات حساب</h1>
        <p className="text-sm text-brand-m_khonsa">مدیریت اطلاعات نمایشی، عکس پروفایل و دستگاه‌های متصل به حساب شما</p>
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-6">
        <AvatarPicker currentAvatar={user.avatarUrl} name={user.name} />
        <div className="border-t border-brand-surface_hover pt-6">
          <ProfileEditForm name={user.name} email={user.email} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <span className="text-sm font-bold text-white block">دستگاه‌های متصل</span>
          <span className="text-xs text-brand-m_khonsa">دستگاه‌هایی که با حساب شما وارد شده‌اند را مدیریت کنید</span>
        </div>
        <SessionsList sessions={sessions} currentSessionId={currentSessionId} />
      </div>
    </div>
  );
}