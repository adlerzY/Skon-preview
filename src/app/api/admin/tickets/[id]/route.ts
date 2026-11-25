import { adminFail, adminJson, positiveInt, runAdmin } from "@/lib/admin/api";
import { adminQuery } from "@/lib/admin/server";
import { ADMIN_TICKET_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  return runAdmin(ADMIN_PERMISSIONS.TICKETS_READ, "خطا در دریافت تیکت", async () => {
    const id = positiveInt((await context.params).id);
    if (!id) return adminFail("شناسه نامعتبر است", 400);
    const data = await adminQuery(ADMIN_TICKET_QUERY, { id });
    if (!data) return adminFail("خطا در دریافت تیکت", 502);
    if (!data.adminTicket) return adminFail("تیکت یافت نشد", 404);
    return adminJson(data.adminTicket);
  });
}