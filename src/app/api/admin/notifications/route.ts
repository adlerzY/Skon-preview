import { NextRequest } from "next/server";
import { adminFail, adminJson, runAdmin, runMutation } from "@/lib/admin/api";
import { adminQuery, ADMIN_UNREAD_COUNT_QUERY } from "@/lib/admin/server";
import { ADMIN_NOTIFICATIONS_QUERY, MARK_ADMIN_NOTIFICATIONS_READ_MUTATION } from "@/lib/graphql/admin";
import { readJsonBody } from "@/lib/requestBody";

export function GET(request: NextRequest) {
  return runAdmin(undefined, "خطا در دریافت اعلان‌ها", async () => {
    const params = request.nextUrl.searchParams;

    if (params.get("countOnly") === "1") {
      const data = await adminQuery(ADMIN_UNREAD_COUNT_QUERY);
      if (!data) return adminFail("خطا در دریافت اعلان‌ها", 502);
      return adminJson({ count: Number(data.adminUnreadNotificationsCount ?? 0) });
    }

    const data = await adminQuery(ADMIN_NOTIFICATIONS_QUERY, {
      first: 20,
      unreadOnly: params.get("unreadOnly") === "true",
    });
    if (!data) return adminFail("خطا در دریافت اعلان‌ها", 502);
    return adminJson({ notifications: Array.isArray(data.adminNotifications) ? data.adminNotifications : [] });
  });
}

export function POST(request: NextRequest) {
  return runAdmin(undefined, "اعلان‌ها به‌روزرسانی نشدند", async () => {
    const body = await readJsonBody(request, 8 * 1024);
    const ids = Array.isArray(body?.notificationIds)
      ? body.notificationIds.map(Number).filter((id: number) => Number.isInteger(id) && id > 0).slice(0, 100)
      : [];
    return runMutation(
      MARK_ADMIN_NOTIFICATIONS_READ_MUTATION,
      { notificationIds: ids },
      "markAdminNotificationsRead",
      "اعلان‌ها به‌روزرسانی نشدند"
    );
  });
}