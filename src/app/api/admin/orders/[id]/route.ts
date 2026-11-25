import { adminFail, adminJson, positiveInt, runAdmin } from "@/lib/admin/api";
import { adminQuery } from "@/lib/admin/server";
import { ADMIN_ORDER_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  return runAdmin(ADMIN_PERMISSIONS.ORDERS_READ, "خطا در دریافت سفارش", async () => {
    const id = positiveInt((await context.params).id);
    if (!id) return adminFail("شناسه نامعتبر است", 400);
    const data = await adminQuery(ADMIN_ORDER_QUERY, { id });
    if (!data) return adminFail("خطا در دریافت سفارش", 502);
    if (!data.adminOrder) return adminFail("سفارش یافت نشد", 404);
    return adminJson(data.adminOrder);
  });
}