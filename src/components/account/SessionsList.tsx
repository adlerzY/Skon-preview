"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Loader2, LogOut } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface SessionNode {
  sessionId: string;
  deviceLabel?: string;
  ipAddress?: string;
  lastActive?: string;
  createdAt?: string;
}

export default function SessionsList({
  sessions,
  currentSessionId,
}: {
  sessions: SessionNode[];
  currentSessionId: string | null;
}) {
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleRevoke = async (sessionId: string) => {
    setError("");
    setRevokingId(sessionId);
    try {
      const res = await fetch("/api/account/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "خطا در خروج از این نشست");
        return;
      }

      if (sessionId === currentSessionId) {
        router.push("/");
        router.refresh();
        return;
      }

      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setRevokingId(null);
    }
  };

  if (sessions.length === 0) {
    return <Card className="p-10 text-center text-brand-m_khonsa">نشست فعالی یافت نشد.</Card>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">{error}</p>}
      {sessions.map((session) => {
        const isCurrent = session.sessionId === currentSessionId;
        return (
          <Card key={session.sessionId} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <Monitor size={18} />
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{session.deviceLabel || "دستگاه نامشخص"}</span>
                  {isCurrent && <Badge tone="sabz">این دستگاه</Badge>}
                </div>
                <span className="text-[11px] text-brand-m_khonsa" dir="ltr">
                  {session.ipAddress || "—"}
                </span>
                {session.lastActive && (
                  <span className="text-[11px] text-brand-m_khonsa">
                    آخرین فعالیت: {new Date(session.lastActive).toLocaleDateString("fa-IR")}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRevoke(session.sessionId)}
              disabled={revokingId === session.sessionId}
              className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 px-3 py-2 transition-colors disabled:opacity-50"
            >
              {revokingId === session.sessionId ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              {isCurrent ? "خروج" : "پایان نشست"}
            </button>
          </Card>
        );
      })}
    </div>
  );
}