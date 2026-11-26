"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";

export interface ReplyNode {
  id: string;
  authorRole: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export default function TicketReplyThread({
  ticketId,
  replies,
  userName,
  onStatusChange,
}: {
  ticketId: number;
  replies: ReplyNode[];
  userName: string;
  onStatusChange?: (status: string) => void;
}) {
  const [items, setItems] = useState(replies);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setError("متن پاسخ را کامل‌تر وارد کنید");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "ثبت پاسخ با خطا مواجه شد");
        return;
      }

      setItems((previous) => [
        ...previous,
        {
          id: `local-${Date.now()}`,
          authorRole: "customer",
          authorName: userName,
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);
      setContent("");
      onStatusChange?.(typeof data?.ticketStatus === "string" ? data.ticketStatus : "open");
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-xs text-brand-m_khonsa text-center py-4">هنوز پاسخی ثبت نشده است.</p>
        ) : (
          items.map((reply) => {
            const isStaff = reply.authorRole === "staff";
            return (
              <div key={reply.id} className={`flex gap-3 ${isStaff ? "flex-row" : "flex-row-reverse"}`}>
                <UserAvatar name={reply.authorName} size="sm" />
                <div
                  className={`flex-1 p-3 border max-w-[80%] ${
                    isStaff ? "bg-brand-blue/10 border-brand-blue/20" : "bg-brand-bg border-brand-surface_hover"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-bold text-white">{isStaff ? "پشتیبانی" : reply.authorName}</span>
                    <span className="text-[10px] text-brand-m_khonsa">
                      {new Date(reply.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <p className="text-sm text-brand-active leading-7 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-brand-surface_hover pt-4">
        {error && <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">{error}</p>}
        <textarea
          rows={3}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="پاسخ خود را بنویسید..."
          className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors resize-none"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 flex items-center gap-2 transition-colors"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {isSubmitting ? "در حال ارسال..." : "ارسال پاسخ"}
        </button>
      </form>
    </div>
  );
}