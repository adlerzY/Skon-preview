"use client";

import { useState } from "react";
import { Loader2, Send, MessageCircle, CheckCircle2 } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import AdminBadge from "@/components/ui/AdminBadge";

export interface CommentNode {
  id: string;
  databaseId?: number;
  parentDatabaseId?: number;
  isStaffReply?: boolean;
  content: string;
  date?: string;
  author?: { node?: { name?: string; avatarUrl?: string } };
}

interface CommentThreadProps {
  targetId: number;
  initialComments: CommentNode[];
  initialCommentsCount?: number;
  isLoggedIn: boolean;
  isStaff?: boolean;
  writeEndpoint: string;
  replyEndpoint: string;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

function ReplyForm({
  isStaff,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  isStaff: boolean;
  onSubmit: (content: string) => Promise<{ ok: boolean; approved: boolean }>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [pendingNotice, setPendingNotice] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setError("متن پاسخ خیلی کوتاه است");
      return;
    }
    setError("");
    const result = await onSubmit(trimmed);
    if (result.ok) {
      setContent("");
      if (!result.approved) setPendingNotice(true);
    }
  };

  if (pendingNotice) {
    return (
      <div className="mt-2 flex items-center gap-2 bg-brand-sabz/10 border border-brand-sabz/20 p-3 text-xs text-brand-sabz font-medium">
        <CheckCircle2 size={14} />
        پاسخ شما ثبت شد و پس از تأیید ادمین نمایش داده می‌شود.
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 bg-brand-bg border border-brand-surface_hover p-3">
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
      <textarea
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="پاسخ خود را بنویسید..."
        className="bg-brand-surface border border-brand-surface_hover p-2.5 text-xs text-brand-active focus:outline-none focus:border-brand-blue resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-xs font-bold px-4 py-1.5 transition-colors flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 size={12} className="animate-spin" />}
          ارسال پاسخ
        </button>
        <button type="button" onClick={onCancel} className="text-brand-m_khonsa hover:text-white text-xs font-bold px-3 py-1.5 transition-colors">
          انصراف
        </button>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  replies,
  isLoggedIn,
  isStaff,
  onReplySubmitted,
  replyEndpoint,
}: {
  comment: CommentNode;
  replies: CommentNode[];
  isLoggedIn: boolean;
  isStaff: boolean;
  onReplySubmitted: (reply: CommentNode) => void;
  replyEndpoint: string;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async (content: string): Promise<{ ok: boolean; approved: boolean }> => {
    if (!comment.databaseId) return { ok: false, approved: false };
    setIsSubmitting(true);
    try {
      const res = await fetch(replyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.databaseId, content }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, approved: false };

      const approved = Boolean(data.approved);
      if (approved) {
        onReplySubmitted({
          id: `local-${Date.now()}`,
          parentDatabaseId: comment.databaseId,
          isStaffReply: isStaff,
          content,
          date: new Date().toISOString(),
          author: { node: { name: isStaff ? "پشتیبانی" : "شما" } },
        });
        setIsReplying(false);
      }
      return { ok: true, approved };
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-menu p-4 md:p-5 border border-brand-surface_hover flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <UserAvatar src={comment.author?.node?.avatarUrl} name={comment.author?.node?.name} size="sm" />
          <span className="text-sm font-bold text-brand-active flex items-center gap-1.5">
            {comment.author?.node?.name || "کاربر"}
            {comment.isStaffReply && <AdminBadge />}
          </span>
        </div>
        {comment.date && <span className="text-xs text-brand-m_khonsa">{new Date(comment.date).toLocaleDateString("fa-IR")}</span>}
      </div>

      <p className="text-brand-surface_m text-sm leading-7 mt-1">{stripHtml(comment.content)}</p>

      {isLoggedIn && comment.databaseId && !isReplying && (
        <button type="button" onClick={() => setIsReplying(true)} className="self-start text-[11px] font-bold text-brand-blue hover:text-white transition-colors mt-1">
          پاسخ
        </button>
      )}

      {isReplying && (
        <ReplyForm isStaff={isStaff} onSubmit={handleReply} onCancel={() => setIsReplying(false)} isSubmitting={isSubmitting} />
      )}

      {replies.length > 0 && (
        <div className="flex flex-col gap-3 mt-3 mr-4 md:mr-8 border-r-2 border-brand-blue/30 pr-4">
          {replies.map((reply) => (
            <div key={reply.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserAvatar src={reply.author?.node?.avatarUrl} name={reply.author?.node?.name} size="xs" />
                  <span className="text-xs font-bold text-brand-active flex items-center gap-1.5">
                    {reply.author?.node?.name || "کاربر"}
                    {reply.isStaffReply && <AdminBadge />}
                  </span>
                </div>
                {reply.date && <span className="text-[11px] text-brand-m_khonsa">{new Date(reply.date).toLocaleDateString("fa-IR")}</span>}
              </div>
              <p className="text-brand-surface_m text-xs leading-6">{stripHtml(reply.content)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({
  targetId,
  initialComments,
  initialCommentsCount = 0,
  isLoggedIn,
  isStaff = false,
  writeEndpoint,
  replyEndpoint,
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentNode[]>(initialComments);
  const [count, setCount] = useState(initialCommentsCount);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingNotice, setPendingNotice] = useState(false);

  const topLevel = comments.filter((c) => !c.parentDatabaseId);
  const repliesByParent = new Map<number, CommentNode[]>();
  for (const c of comments) {
    if (c.parentDatabaseId) {
      const list = repliesByParent.get(c.parentDatabaseId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentDatabaseId, list);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setError("متن نظر خیلی کوتاه است");
      return;
    }
    setError("");
    setPendingNotice(false);
    setIsSubmitting(true);
    try {
      const res = await fetch(writeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: targetId, content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "ثبت نظر با خطا مواجه شد");
        return;
      }

      const approved = Boolean(data.approved);
      if (approved) {
        setComments((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            content: trimmed,
            isStaffReply: isStaff,
            date: new Date().toISOString(),
            author: { node: { name: isStaff ? "پشتیبانی" : "شما" } },
          },
        ]);
        setCount((c) => c + 1);
      } else {
        setPendingNotice(true);
      }
      setContent("");
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" dir="rtl">
      <h2 className="text-lg font-black text-brand-active border-r-4 border-brand-blue pr-3 flex items-center gap-2">
        <MessageCircle size={18} />
        نظرات ({count.toLocaleString("fa-IR")})
      </h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="bg-brand-menu p-4 md:p-5 border border-brand-surface_hover flex flex-col gap-3">
          {error && <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-2.5">{error}</p>}
          {pendingNotice && (
            <p className="text-xs text-brand-sabz font-medium bg-brand-sabz/10 border border-brand-sabz/20 p-2.5 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              نظر شما ثبت شد و پس از تأیید ادمین نمایش داده می‌شود.
            </p>
          )}
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="نظر خود را بنویسید..."
            className="bg-brand-surface border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue resize-none"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 flex items-center gap-2 transition-colors"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            ثبت نظر
          </button>
        </form>
      ) : (
        <div className="bg-brand-menu p-5 border border-brand-surface_hover text-center text-sm text-brand-surface_m">
          برای ثبت نظر ابتدا وارد حساب کاربری خود شوید.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {topLevel.length === 0 ? (
          <div className="bg-brand-menu p-6 border border-brand-surface_hover text-center text-sm text-brand-surface_m">
            هنوز نظری ثبت نشده. اولین نفر باشید!
          </div>
        ) : (
          topLevel.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              replies={c.databaseId ? repliesByParent.get(c.databaseId) ?? [] : []}
              isLoggedIn={isLoggedIn}
              isStaff={isStaff}
              replyEndpoint={replyEndpoint}
              onReplySubmitted={(reply) => {
                setComments((prev) => [...prev, reply]);
                setCount((n) => n + 1);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}