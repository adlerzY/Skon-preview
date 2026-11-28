"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, UserCheck } from "lucide-react";
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
import { AdminErrorBanner } from "./AdminListParts";
import { faDateTime, faNumber } from "./format";
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS, ticketStatusTone } from "./labels";

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
        <Link href="/admin/tickets" className="inline-flex items-center gap-2 text-[13px] text-brand-m_khonsa hover:text-brand-white">
          <ArrowRight size={15} /> بازگشت به تیکت‌ها
        </Link>
        <div className="mt-4">
          <AdminErrorBanner message={error} />
          <AdminEmpty title={loading ? "تیکت در حال دریافت اطلاعات..." : "تیکت پیدا نشد."} />
        </div>
      </AdminPage>
    );
  }

  const { ticket } = data;
  const ticketId = ticket.databaseId;

  return (
    <AdminPage>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/tickets" className="inline-flex items-center gap-2 text-[13px] text-brand-m_khonsa hover:text-brand-white">
          <ArrowRight size={15} /> بازگشت به تیکت‌ها
        </Link>
        <AdminBadge tone={ticketStatusTone(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}</AdminBadge>
      </div>

      <AdminPageIntro
        title={ticket.title}
        description={`#${faNumber(ticketId)} · اولویت ${TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority} · ${faDateTime(ticket.date)}`}
        action={
          canClaim ? (
            <AdminButton variant="primary" onClick={() => void act({ action: "claim", ticketId })} disabled={busy}>
              <UserCheck size={15} /> دریافت مسئولیت
            </AdminButton>
          ) : undefined
        }
      />

      <AdminErrorBanner message={error} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="گفتگو" />
            <div className="max-h-[520px] space-y-2 overflow-y-auto p-4">
              {data.replies.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[5px] border border-brand-surface_hover p-3 ${item.authorRole === "staff" ? "bg-brand-blue/5" : "bg-brand-bg"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[14px] font-medium text-brand-active">{item.authorName}</div>
                    <div className="text-[12px] text-brand-m_khonsa">{faDateTime(item.createdAt)}</div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-[14px] leading-7 text-brand-active">{item.content}</div>
                </div>
              ))}
              {data.replies.length === 0 ? <AdminEmpty title="گفتگویی ثبت نشده است." /> : null}
            </div>
            {canWrite ? (
              <div className="border-t border-brand-surface_hover p-4">
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
            ) : null}
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <details>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold text-brand-active marker:content-none [&::-webkit-details-marker]:hidden">
                <span>یادداشت‌های داخلی</span>
                <span className="text-[13px] font-normal text-brand-surface_m">{faNumber(data.internalNotes.length)}</span>
              </summary>
              <div className="space-y-2 border-t border-brand-surface_hover p-4">
                {data.internalNotes.map((item) => (
                  <div key={item.id} className="rounded-[5px] border border-brand-surface_hover bg-brand-bg p-3">
                    <div className="whitespace-pre-wrap text-[14px] leading-7 text-brand-active">{item.content}</div>
                    <div className="mt-1.5 text-[12px] text-brand-m_khonsa">
                      {item.adminName} · {faDateTime(item.createdAt)}
                    </div>
                  </div>
                ))}
                {data.internalNotes.length === 0 ? <AdminEmpty title="یادداشت داخلی وجود ندارد." /> : null}
                {canWrite ? (
                  <div className="pt-2">
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
                ) : null}
              </div>
            </details>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <details>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold text-brand-active marker:content-none [&::-webkit-details-marker]:hidden">
                <span>تاریخچهٔ تیکت</span>
                <span className="text-[13px] font-normal text-brand-surface_m">{faNumber(data.events.length)}</span>
              </summary>
              <div className="border-t border-brand-surface_hover px-4">
                {data.events.map((item) => (
                  <div key={item.id} className="border-b border-brand-surface_hover py-2.5 last:border-b-0">
                    <div className="text-[12px] text-brand-m_khonsa">
                      {item.adminName} · {faDateTime(item.createdAt)}
                    </div>
                    <div className="mt-0.5 text-[14px] text-brand-active">
                      {EVENT_LABELS[item.type] ?? item.type}
                      {item.fromStatus && item.toStatus
                        ? ` · ${TICKET_STATUS_LABELS[item.fromStatus] ?? item.fromStatus} ← ${TICKET_STATUS_LABELS[item.toStatus] ?? item.toStatus}`
                        : ""}
                    </div>
                  </div>
                ))}
                {data.events.length === 0 ? <AdminEmpty title="رویدادی ثبت نشده است." /> : null}
              </div>
            </details>
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="مدیریت تیکت" />
            <div className="space-y-4 p-4">
              {canWrite ? (
                <>
                  <div className="space-y-2">
                    <div className="text-[12px] text-brand-m_khonsa">وضعیت</div>
                    <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)}>
                      {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
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
                  </div>
                  <div className="space-y-2 border-t border-brand-surface_hover pt-4">
                    <div className="text-[12px] text-brand-m_khonsa">مسئول</div>
                    <AdminSelect value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                      <option value="">انتخاب مدیر</option>
                      {staff.map((member) => (
                        <option key={member.databaseId} value={member.databaseId}>
                          {member.name} · {member.email}
                        </option>
                      ))}
                    </AdminSelect>
                    <AdminButton
                      className="w-full"
                      onClick={() => void act({ action: "reassign", ticketId, adminUserId: Number(assignee) })}
                      disabled={busy || !assignee || assignee === String(ticket.assigneeId ?? "")}
                    >
                      تغییر مسئول
                    </AdminButton>
                  </div>
                </>
              ) : (
                <>
                  <AdminFieldRow label="وضعیت" value={TICKET_STATUS_LABELS[ticket.status] ?? ticket.status} ltr={false} />
                  <AdminFieldRow label="مسئول" value={ticket.assigneeName || "بدون مسئول"} ltr={false} />
                </>
              )}
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="مشتری" />
            <div className="px-4 py-1">
              <AdminFieldRow label="نام" value={ticket.customerName || "—"} ltr={false} />
              <AdminFieldRow label="ایمیل" value={ticket.customerEmail || "—"} />
              {ticket.customerId ? (
                <div className="py-2.5">
                  <Link href={`/admin/users/${ticket.customerId}`} className="text-[13px] text-brand-blue hover:text-brand-active">
                    مشاهدهٔ پروندهٔ مشتری
                  </Link>
                </div>
              ) : null}
              {ticket.linkedOrderId ? (
                <div className="border-t border-brand-surface_hover py-2.5">
                  <Link href={`/admin/orders/${ticket.linkedOrderId}`} className="text-[13px] text-brand-blue hover:text-brand-active">
                    سفارش مرتبط #{faNumber(ticket.linkedOrderId)}
                  </Link>
                </div>
              ) : null}
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPage>
  );
}