import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthToken, getCurrentUser, getSessionId } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { GET_SESSIONS_QUERY } from "@/lib/graphql/auth";
import AvatarPicker from "@/components/account/AvatarPicker";
import ProfileEditForm from "@/components/account/ProfileEditForm";
import SetPasswordForm from "@/components/account/SetPasswordForm";
import SessionsList from "@/components/account/SessionsList";
import { AccountSettingsLoadingShell } from "@/components/account/AccountPageLoadingShell";

type SessionsData = Awaited<ReturnType<typeof fetchGraphQL>>;

type SettingsUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

async function SettingsDataStream({
  user,
  currentSessionIdPromise,
  dataPromise,
}: {
  user: SettingsUser;
  currentSessionIdPromise: ReturnType<typeof getSessionId>;
  dataPromise: Promise<SessionsData>;
}) {
  const [currentSessionId, data] = await Promise.all([currentSessionIdPromise, dataPromise]);
  const sessions = data?.viewer?.sessions ?? [];

  return (
    <>
      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-6">
        <AvatarPicker
          currentAvatarId={user.avatarId}
          currentAvatarUrl={user.avatarUrl}
          name={user.name}
          isStaff={user.isStaff}
        />
        <div className="border-t border-brand-surface_hover pt-6">
          <ProfileEditForm name={user.name} email={user.email} />
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-6">
        <SetPasswordForm hasManualPassword={user.hasManualPassword} />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <span className="text-sm font-bold text-white block">دستگاه‌های متصل</span>
          <span className="text-xs text-brand-m_khonsa">دستگاه‌هایی که با حساب شما وارد شده‌اند را مدیریت کنید</span>
        </div>
        <SessionsList sessions={sessions} currentSessionId={currentSessionId} />
      </div>
    </>
  );
}

export default async function SettingsPage() {
  const tokenPromise = getAuthToken();
  const token = await tokenPromise;
  const dataPromise = fetchGraphQL(GET_SESSIONS_QUERY, {}, [], "no-store", token || undefined);
  const currentSessionIdPromise = getSessionId();
  const userPromise = getCurrentUser();
  const user = await userPromise;

  if (!user) redirect("/my-account");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-white mb-1">تنظیمات حساب</h1>
        <p className="text-sm text-brand-m_khonsa">مدیریت اطلاعات نمایشی، عکس پروفایل و دستگاه‌های متصل به حساب شما</p>
      </div>

      <Suspense fallback={<AccountSettingsLoadingShell />}>
        <SettingsDataStream
          user={user}
          currentSessionIdPromise={currentSessionIdPromise}
          dataPromise={dataPromise}
        />
      </Suspense>
    </div>
  );
}
