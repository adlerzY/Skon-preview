"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, MessageSquare, StickyNote, UserCheck, Users } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminFieldRow,
  AdminPage,
  AdminPageIntro,
  AdminSectionHeader,
  AdminSelect,
  AdminTextarea,
} from "./AdminUi";

const STATUS_LABELS: Record<string, string> = {
  open: "باز",
  claimed: "در اختیار ادمین",
  waiting_user: "در انتظار کاربر",
  waiting_staff: "در انتظار پشتیبانی",
  resolved: "حل‌شده",
  closed: "بسته‌شده",
};

const PRIORITY_LABELS: Record<string, string> = { low: "کم", normal: "عادی", high: "زیاد", urgent: "فوری" };

const EVENT_LABELS: Record<string, string> = {
  claimed: "دریافت مسئولیت",
  reply: "پاسخ به مشتری",
  status_change: "تغییر وضعیت",
  reassign: "تغییر مسئول",
  note: "یادداشت داخلی",
};

interface Reply {
  id: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

interface TicketEvent {
  id: number;
  type: string;
  content: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  adminName: string;
  createdAt: string;
}

interface Detail {
  ticket: {
    databaseId: number;
    title: string;
    date: string;
    status: string;
    priority: string;
    customerId: number | null;
    customerName: string;
    customerEmail: string;
    linkedOrderId: number | null;
    assigneeId: number | null;
    assigneeName: string | null;
    claimExpiresAt: string | null;
  };
  replies: Reply[];
  events: TicketEvent[];
  internalNotes: TicketEvent[];
}

interface StaffUser {
  databaseId: number;
  name: string;
  email: string;
}

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("fa-IR") : "—");

export default function AdminTicketDetail({ data: initialData, id }: { data?: Detail; id: number }) {
  const { permissions } = useAdminContext();
  const [data, setData] = useState<Detail | null>(initialData ?? null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(!initialData);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(initialData?.ticket.status ?? "open");
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [assignee, setAssignee] = useState(initialData?.ticket.assigneeId ? String(initialData.ticket.assigneeId) : "");
  const [error, setError] = useState("");

  const canWrite = permissions.includes("tickets.write");
  const canClaim = permissions.includes("tickets.claim");

  const applyDetail = useCallback((detail: Detail) => {
    setData(detail);
    setStatus(detail.ticket.status);
    setAssignee(detail.ticket.assigneeId ? String(detail.ticket.assigneeId) : "");
  }, []);

  const fetchDetail = useCallback(async () => {
    const response = await fetch(`/api/admin/tickets/${id}`, { cache: "no-store" });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json) throw new Error(json?.error || "خطا در دریافت تیکت");
    applyDetail(json as Detail);
  }, [id, applyDetail]);

  useEffect(() => {
    if (initialData) return;
    fetchDetail()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "خطا در دریافت تیکت"))
      .finally(() => setLoading(false));
  }, [initialData, fetchDetail]);

  useEffect(() => {
    if (!canWrite) return;
    let active = true;
    fetch("/api/admin/tickets?staff=1", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        if (active) setStaff(Array.isArray(json?.staff) ? json.staff : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [canWrite]);

  const act = async (body: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error || "عملیات انجام نشد");
      await fetchDetail();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "عملیات انجام نشد");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <AdminPage>
        <Link href="/admin/tickets" className="inline-flex items-center gap-2 text-sm font-bold text-brand-m_khonsa hover:text-white">
          <ArrowRight size={15} /> بازگشت به تیکت‌ها
        </Link>
        {error && (
          <div role="alert" className="mt-4 rounded-[4px] border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
        <div className="mt-4">
          <AdminEmpty title={loading ? "تیکت در حال دریافت اطلاعات..." : "تیکت پیدا نشد."} />
        </div>
      </AdminPage>
    );
  }

  const { ticket } = data;
  const statusTone: "success" | "warning" | "info" =
    ticket.status === "resolved" || ticket.status === "closed" ? "success" : ticket.status === "open" ? "warning" : "info";
  const ticketId = ticket.databaseId;

  return (
    <AdminPage>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/tickets" className="inline-flex items-center gap-2 text-sm font-bold text-brand-m_khonsa hover:text-white">
          <ArrowRight size={15} /> بازگشت به تیکت‌ها
        </Link>
        <AdminBadge tone={statusTone}>{STATUS_LABELS[ticket.status] ?? ticket.status}</AdminBadge>
      </div>

      <AdminPageIntro
        eyebrow="پرونده تیکت"
        title={ticket.title}
        description={`#${ticketId} · اولویت ${PRIORITY_LABELS[ticket.priority] ?? ticket.priority}`}
        action={
          canClaim ? (
            <AdminButton variant="primary" onClick={() => void act({ action: "claim", ticketId })} disabled={busy}>
              <UserCheck size={14} /> دریافت مسئولیت
            </AdminButton>
          ) : undefined
        }
      />

      {error && (
        <div role="alert" className="mb-4 rounded-[4px] border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <AdminSectionHeader icon={<MessageSquare size={17} />} title="گفتگو" description="پیام‌های مشتری و پاسخ‌های تیم" />
            <div className="max-h-[520px] space-y-2 overflow-y-auto p-4">
              {data.replies.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[4px] border border-brand-surface_hover p-3 ${item.authorRole === "staff" ? "bg-brand-blue/5" : "bg-brand-bg/40"}`}
                >
                  <div className="flex justify-between gap-3">
                    <div className="text-sm font-black text-white">{item.authorName}</div>
                    <div className="text-xs text-brand-m_khonsa">{formatDateTime(item.createdAt)}</div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white">{item.content}</div>
                </div>
              ))}
              {data.replies.length === 0 && <AdminEmpty title="گفتگویی ثبت نشده است." />}
            </div>
            {canWrite && (
              <div className="border-t border-white/[.06] p-4">
                <AdminTextarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} placeholder="پاسخ به مشتری..." />
                <div className="mt-2 flex justify-end">
                  <AdminButton
                    variant="primary"
                    disabled={busy || !reply.trim()}
                    onClick={async () => {
                      if (await act({ action: "reply", ticketId, content: reply })) setReply("");
                    }}
                  >
                    ارسال پاسخ
                  </AdminButton>
                </div>
              </div>
            )}
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminSectionHeader icon={<StickyNote size={17} />} title="یادداشت‌های داخلی" />
            <div className="space-y-2 p-4">
              {data.internalNotes.map((item) => (
                <div key={item.id} className="rounded-[4px] border border-brand-surface_hover bg-brand-bg/30 p-3">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-white">{item.content}</div>
                  <div className="mt-2 text-xs text-brand-m_khonsa">
                    {item.adminName} · {formatDateTime(item.createdAt)}
                  </div>
                </div>
              ))}
              {data.internalNotes.length === 0 && <AdminEmpty title="یادداشت داخلی وجود ندارد." />}
            </div>
            {canWrite && (
              <div className="border-t border-white/[.06] p-4">
                <AdminTextarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="یادداشت داخلی..." />
                <div className="mt-2 flex justify-end">
                  <AdminButton
                    disabled={busy || !note.trim()}
                    onClick={async () => {
                      if (await act({ action: "note", ticketId, content: note })) setNote("");
                    }}
                  >
                    ثبت یادداشت
                  </AdminButton>
                </div>
              </div>
            )}
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="گردش تیکت" />
            <div className="space-y-3 p-4">
              {canWrite ? (
                <>
                  <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </AdminSelect>
                  <AdminButton
                    variant="primary"
                    className="w-full"
                    onClick={() => void act({ action: "status", ticketId, status })}
                    disabled={busy || status === ticket.status}
                  >
                    ذخیره وضعیت
                  </AdminButton>
                </>
              ) : (
                <AdminFieldRow label="وضعیت" value={STATUS_LABELS[ticket.status] ?? ticket.status} ltr={false} />
              )}
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminSectionHeader icon={<Users size={17} />} title="مسئول تیکت" />
            <div className="p-4">
              {canWrite ? (
                <>
                  <AdminSelect value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                    <option value="">انتخاب مدیر</option>
                    {staff.map((member) => (
                      <option key={member.databaseId} value={member.databaseId}>
                        {member.name} · {member.email}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminButton
                    className="mt-2 w-full"
                    onClick={() => void act({ action: "reassign", ticketId, adminUserId: Number(assignee) })}
                    disabled={busy || !assignee || assignee === String(ticket.assigneeId ?? "")}
                  >
                    تغییر مسئول
                  </AdminButton>
                </>
              ) : (
                <AdminFieldRow label="مسئول" value={ticket.assigneeName || "بدون مسئول"} ltr={false} />
              )}
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="اطلاعات مشتری" />
            <div className="p-4">
              <AdminFieldRow label="نام" value={ticket.customerName || "—"} ltr={false} />
              <AdminFieldRow label="ایمیل" value={ticket.customerEmail || "—"} />
              {ticket.linkedOrderId && (
                <Link href={`/admin/orders/${ticket.linkedOrderId}`} className="mt-2 block text-sm font-bold text-brand-blue hover:text-white">
                  سفارش مرتبط #{ticket.linkedOrderId}
                </Link>
              )}
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="تاریخچه" />
            <div className="space-y-2 p-4">
              {data.events.map((item) => (
                <div key={item.id} className="border-b border-brand-surface_hover pb-2 last:border-0">
                  <div className="text-xs text-brand-m_khonsa">
                    {item.adminName} · {formatDateTime(item.createdAt)}
                  </div>
                  <div className="mt-1 text-sm text-white">
                    {EVENT_LABELS[item.type] ?? item.type}
                    {item.fromStatus && item.toStatus
                      ? ` · ${STATUS_LABELS[item.fromStatus] ?? item.fromStatus} ← ${STATUS_LABELS[item.toStatus] ?? item.toStatus}`
                      : ""}
                  </div>
                </div>
              ))}
              {data.events.length === 0 && <AdminEmpty title="رویدادی ثبت نشده است." />}
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPage>
  );
}