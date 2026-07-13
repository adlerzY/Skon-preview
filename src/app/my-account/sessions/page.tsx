import { redirect } from "next/navigation";
import { getAuthToken, getCurrentUser, getSessionId } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { GET_SESSIONS_QUERY } from "@/lib/graphql/auth";
import SessionsList from "@/components/account/SessionsList";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  const token = await getAuthToken();
  const currentSessionId = await getSessionId();
  const data = await fetchGraphQL(GET_SESSIONS_QUERY, {}, [], "no-store", token || undefined);
  const sessions = data?.viewer?.sessions ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-white mb-1">مدیریت نشست‌ها</h1>
        <p className="text-sm text-brand-m_khonsa">دستگاه‌هایی که با حساب شما وارد شده‌اند را مدیریت کنید.</p>
      </div>

      <SessionsList sessions={sessions} currentSessionId={currentSessionId} />
    </div>
  );
}