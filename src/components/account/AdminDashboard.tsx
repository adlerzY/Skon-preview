import Link from "next/link";
import { LifeBuoy, MessageSquare, Settings, ShoppingBag, Ticket, ClipboardList } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import AdminBadge from "@/components/ui/AdminBadge";
import XPLevelCard from "./XPLevelCard";
import AdminTicketsPanel from "./AdminTicketsPanel";
import type { SessionUser } from "@/lib/auth/session";

interface AdminTicketItem {
  id: string;
  databaseId: number;
  title: string;
  date?: string;
  linkedOrderId?: number | null;
  customerName?: string | null;
}

interface AdminDashboardProps {
  user: SessionUser;
  openTicketsCount: number;
  pendingReviewsCount: number;
  initialOpenTickets: AdminTicketItem[];
  wpAdminUrl: string | null;
}

export default function AdminDashboard({
  user,
  openTicketsCount,
  pendingReviewsCount,
  initialOpenTickets,
  wpAdminUrl,
}: AdminDashboardProps) {
  const quickActions = wpAdminUrl
    ? [
        { label: "مدیریت محصولات", href: `${wpAdminUrl}/edit.php?post_type=product`, icon: ShoppingBag },
        { label: "مدیریت تیکت‌ها", href: `${wpAdminUrl}/edit.php?post_type=support_ticket`, icon: Ticket },
        { label: "دیدگاه‌های در انتظار", href: `${wpAdminUrl}/edit-comments.php?comment_status=moderated`, icon: ClipboardList },
        { label: "پنل مدیریت وردپرس", href: wpAdminUrl, icon: Settings },
      ]
    : [];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        <div className="lg:col-span-2 bg-brand-surface border border-brand-surface_hover p-5 flex items-center gap-5">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <UserAvatar src={user.avatarUrl} name={user.name} size="lg" ring />
            <AdminBadge />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <span className="font-black text-lg text-white truncate">{user.name}</span>
            <span className="text-xs text-brand-m_khonsa truncate" dir="ltr">{user.email}</span>

            <div className="flex flex-wrap gap-2 mt-1.5">
              <Link href="/my-account/settings" className="text-xs font-bold text-brand-blue hover:text-white border border-brand-blue/30 hover:bg-brand-blue px-3 py-1.5 transition-colors">
                ویرایش پروفایل
              </Link>
              <Link href="/my-account/tickets" className="text-xs font-bold text-brand-m_khonsa hover:text-white border border-brand-surface_hover hover:bg-brand-surface_hover px-3 py-1.5 transition-colors">
                تیکت‌های پشتیبانی
              </Link>
            </div>
          </div>
        </div>

        <XPLevelCard isAdmin />
      </div>

      <div className="grid grid-cols-2 gap-3 shrink-0">
        <StatCard href="/my-account/tickets" icon={<LifeBuoy size={18} />} label="تیکت‌های باز" value={openTicketsCount} tone="zard" />
        <StatCard href="/my-account/reviews" icon={<MessageSquare size={18} />} label="دیدگاه‌های در انتظار تأیید" value={pendingReviewsCount} tone="blue" />
      </div>

      {quickActions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          {quickActions.map((action) => {
            const Icon = action.icon; 
            return (
              <a
                key={action.href}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover p-3.5 flex flex-col items-center gap-2 text-center transition-colors">
                <span className="w-9 h-9 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Icon size={16} />
                </span>
                <span className="text-[11px] font-bold text-brand-m_khonsa">{action.label}</span>
              </a>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 flex-1 min-h-0">
        <AdminTicketsPanel initialTickets={initialOpenTickets} />
      </div>
    </div>
  );
}
function StatCard({ href, icon, label, value, tone }: { href: string; icon: React.ReactNode; label: string; value: number; tone: "blue" | "zard" }) {
  const toneClasses: Record<string, string> = {
    blue: "text-brand-blue bg-brand-blue/10",
    zard: "text-brand-zard bg-brand-zard/10",
  };

  return (
    <Link href={href} className="bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover p-3.5 flex flex-col gap-2.5 transition-colors group">
      <div className="flex items-center justify-between">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toneClasses[tone]}`}>{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black text-white leading-none mb-1">{value.toLocaleString("fa-IR")}</span>
        <span className="text-[11px] text-brand-m_khonsa font-medium">{label}</span>
      </div>
    </Link>
  );
}