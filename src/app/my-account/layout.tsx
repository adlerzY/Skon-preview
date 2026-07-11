import DashboardSidebar from "@/components/account/DashboardSidebar";
import NotificationBell from "@/components/account/NotificationBell";
import UserAvatar from "@/components/ui/UserAvatar";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-brand-bg flex items-center justify-center p-5" dir="rtl">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-brand-bg flex flex-col lg:flex-row" dir="rtl">
      <DashboardSidebar avatarUrl={user.avatarUrl} name={user.name} />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-[64px] shrink-0 border-b border-brand-surface_hover flex items-center justify-between px-6 bg-brand-surface/50">
          <div className="flex items-center gap-2.5">
            <UserAvatar src={user.avatarUrl} name={user.name} size="sm" />
            <span className="text-sm font-bold text-white">سلام {user.name.split(" ")[0]} 👋</span>
          </div>
          <NotificationBell />
        </div>
        <main className="flex-1 w-full max-w-[1400px] mx-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}