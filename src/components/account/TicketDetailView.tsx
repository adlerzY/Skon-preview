"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import TicketReplyThread, { type ReplyNode } from "./TicketReplyThread";

const STATUS_TONE: Record<string, "blue" | "sabz" | "zard" | "red" | "neutral"> = {
  open: "zard",
  answered: "blue",
  closed: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  open: "باز",
  answered: "پاسخ داده‌شده",
  closed: "بسته‌شده",
};

export interface TicketDetailData {
  databaseId: number;
  title: string;
  content: string;
  date?: string | null;
  ticketStatus?: string | null;
  linkedOrderId?: number | null;
  replies: ReplyNode[];
}

export default function TicketDetailView({ ticket, userName }: { ticket: TicketDetailData; userName: string }) {
  const [status, setStatus] = useState(ticket.ticketStatus ?? "open");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link
        href="/my-account/tickets"
        className="inline-flex items-center gap-1 text-sm text-brand-m_khonsa hover:text-white transition-colors"
      >
        <ChevronRight size={16} />
        بازگشت به تیکت‌ها
      </Link>

      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-surface_hover pb-4">
          <h1 className="text-lg font-black text-white">{ticket.title}</h1>
          <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-brand-m_khonsa">
          {ticket.date && <span>تاریخ ثبت: {new Date(ticket.date).toLocaleDateString("fa-IR")}</span>}
          {ticket.linkedOrderId && <span>سفارش مرتبط: #{ticket.linkedOrderId}</span>}
        </div>

        <p className="text-sm text-brand-active leading-8 whitespace-pre-wrap">{ticket.content}</p>
      </Card>

      <Card className="p-6">
        <TicketReplyThread
          ticketId={ticket.databaseId}
          replies={ticket.replies}
          userName={userName}
          onStatusChange={setStatus}
        />
      </Card>
    </div>
  );
}