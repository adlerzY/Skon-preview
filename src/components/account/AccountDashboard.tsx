import Link from "next/link";
import { Package, Heart, LifeBuoy, UserCog, ChevronLeft, Download, HelpCircle, ShoppingBag } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import ProfileCompletionRing from "./ProfileCompletionRing";
import InfoTip from "./InfoTip";
import type { SessionUser } from "@/lib/auth/session";

interface OrderSummary {
  id: string;
  databaseId: number;
  orderNumber?: string;
  status?: string;
  date?: string;
  total?: string;
}

interface TicketSummary {
  id: string;
  databaseId: number;
  title: string;
  date?: string;
  ticketStatus?: string;
}

interface AccountDashboardProps {
  user: SessionUser;
  recentOrders: OrderSummary[];
  successfulOrdersCount: number;
  wishlistCount: number;
  recentTickets: TicketSummary[];
  openTicketsCount: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار پرداخت", color: "text-brand-zard bg-brand-zard/10 border-brand-zard/20" },
  PROCESSING: { label: "در حال پردازش", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" },
  ON_HOLD: { label: "در انتظار بررسی", color: "text-brand-zard bg-brand-zard/10 border-brand-zard/20" },
  COMPLETED: { label: "تکمیل‌شده", color: "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20" },
  CANCELLED: { label: "لغو‌شده", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  REFUNDED: { label: "بازگشت وجه", color: "text-brand-m_khonsa bg-brand-surface" },
  FAILED: { label: "ناموفق", color: "text-red-500 bg-red-500/10 border-red-500/20" },
};

const TICKET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "باز", color: "text-brand-zard bg-brand-zard/10 border-brand-zard/20" },
  answered: { label: "پاسخ داده‌شده", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" },
  closed: { label: "بسته‌شده", color: "text-brand-m_khonsa bg-brand-surface" },
};

export default function AccountDashboard({
  user,
  recentOrders,
  successfulOrdersCount,
  wishlistCount,
  recentTickets,
  openTicketsCount,
}: AccountDashboardProps) {
  const completionChecks = [Boolean(user.avatarUrl), Boolean(user.email), successfulOrdersCount > 0];
  const completionPercentage = (completionChecks.filter(Boolean).length / completionChecks.length) * 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <UserAvatar src={user.avatarUrl} name={user.name} size="xl" ring />

        <div className="flex-1 flex flex-col gap-2 text-center sm:text-right w-full">
          <span className="font-black text-xl text-white">{user.name}</span>
          <span className="text-xs text-brand-m_khonsa" dir="ltr">{user.email}</span>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
            <Link href="/my-account/settings" className="text-xs font-bold text-brand-blue hover:text-white border border-brand-blue/30 hover:bg-brand-blue px-3 py-1.5 transition-colors">
              ویرایش پروفایل
            </Link>
            <Link href="/my-account/orders" className="text-xs font-bold text-brand-m_khonsa hover:text-white border border-brand-surface_hover hover:bg-brand-surface_hover px-3 py-1.5 transition-colors">
              مشاهده سفارش‌ها
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-center gap-1">
            <ProfileCompletionRing percentage={completionPercentage} />
            <span className="text-[10px] text-brand-m_khonsa flex items-center">
              تکمیل حساب
              <InfoTip text="با ثبت اولین خرید و تکمیل اطلاعات حساب، این حلقه پر می‌شود." />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard href="/my-account/orders" icon={<Package size={20} />} label="سفارش‌های موفق" value={successfulOrdersCount} tone="blue" />
        <StatCard href="/my-account/wishlist" icon={<Heart size={20} />} label="علاقه‌مندی‌ها" value={wishlistCount} tone="zard" />
        <StatCard href="/my-account/tickets" icon={<LifeBuoy size={20} />} label="تیکت‌های باز" value={openTicketsCount} tone="sabz" />
        <StatCard href="/my-account/settings" icon={<UserCog size={20} />} label="تنظیمات حساب" value={null} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PreviewPanel title="آخرین سفارش‌ها" viewAllHref="/my-account/orders" isEmpty={recentOrders.length === 0} emptyText="هنوز سفارشی ثبت نکرده‌اید.">
          {recentOrders.map((order) => {
            const info = STATUS_LABELS[order.status ?? ""] ?? { label: order.status ?? "نامشخص", color: "text-brand-m_khonsa bg-brand-surface" };
            return (
              <div key={order.id} className="flex items-center justify-between gap-3 py-3 border-b border-brand-surface_hover last:border-0">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-white">سفارش #{order.orderNumber || order.databaseId}</span>
                  {order.date && <span className="text-[11px] text-brand-m_khonsa">{new Date(order.date).toLocaleDateString("fa-IR")}</span>}
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 border shrink-0 ${info.color}`}>{info.label}</span>
              </div>
            );
          })}
        </PreviewPanel>

        <PreviewPanel title="آخرین تیکت‌ها" viewAllHref="/my-account/tickets" isEmpty={recentTickets.length === 0} emptyText="هنوز تیکتی ثبت نکرده‌اید.">
          {recentTickets.map((ticket) => {
            const status = ticket.ticketStatus ?? "open";
            const info = TICKET_STATUS_LABELS[status] ?? { label: status, color: "text-brand-m_khonsa bg-brand-surface" };
            return (
              <Link
                key={ticket.id}
                href={`/my-account/tickets/${ticket.databaseId}`}
                className="flex items-center justify-between gap-3 py-3 border-b border-brand-surface_hover last:border-0 hover:bg-white/5 transition-colors -mx-2 px-2"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-white truncate">{ticket.title}</span>
                  {ticket.date && <span className="text-[11px] text-brand-m_khonsa">{new Date(ticket.date).toLocaleDateString("fa-IR")}</span>}
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 border shrink-0 ${info.color}`}>{info.label}</span>
              </Link>
            );
          })}
        </PreviewPanel>
      </div>

      <div className="bg-brand-surface border border-brand-surface_hover p-5">
        <span className="text-xs font-bold text-brand-surface_m uppercase tracking-wide mb-3 block">دسترسی سریع</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/download" icon={<Download size={18} />} label="دانلود بازی" />
          <QuickAction href="/support" icon={<HelpCircle size={18} />} label="پشتیبانی" />
          <QuickAction href="/my-account/tickets/new" icon={<LifeBuoy size={18} />} label="تیکت جدید" />
          <QuickAction href="/" icon={<ShoppingBag size={18} />} label="فروشگاه" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ href, icon, label, value, tone }: { href: string; icon: React.ReactNode; label: string; value: number | null; tone: "blue" | "zard" | "sabz" | "neutral" }) {
  const toneClasses: Record<string, string> = {
    blue: "text-brand-blue bg-brand-blue/10",
    zard: "text-brand-zard bg-brand-zard/10",
    sabz: "text-brand-sabz bg-brand-sabz/10",
    neutral: "text-brand-m_khonsa bg-white/5",
  };

  return (
    <Link href={href} className="bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover p-4 flex flex-col gap-3 transition-colors group">
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${toneClasses[tone]}`}>{icon}</span>
        <ChevronLeft size={16} className="text-brand-surface_m group-hover:text-white transition-colors" />
      </div>
      <div className="flex flex-col">
        {value !== null && <span className="text-2xl font-black text-white leading-none mb-1">{value.toLocaleString("fa-IR")}</span>}
        <span className="text-xs text-brand-m_khonsa font-medium">{label}</span>
      </div>
    </Link>
  );
}

function PreviewPanel({ title, viewAllHref, isEmpty, emptyText, children }: { title: string; viewAllHref: string; isEmpty: boolean; emptyText: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-surface border border-brand-surface_hover p-5">
      <div className="flex items-center justify-between mb-2 border-b border-brand-surface_hover pb-3">
        <span className="text-sm font-bold text-white">{title}</span>
        <Link href={viewAllHref} className="text-xs text-brand-blue hover:text-white transition-colors font-bold">مشاهده همه</Link>
      </div>
      {isEmpty ? <div className="py-8 text-center text-xs text-brand-m_khonsa">{emptyText}</div> : <div className="flex flex-col">{children}</div>}
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-2 bg-brand-bg hover:bg-brand-surface_hover border border-brand-surface_hover p-4 text-center transition-colors group">
      <span className="text-brand-m_khonsa group-hover:text-brand-blue transition-colors">{icon}</span>
      <span className="text-[11px] font-bold text-brand-m_khonsa group-hover:text-white transition-colors">{label}</span>
    </Link>
  );
}