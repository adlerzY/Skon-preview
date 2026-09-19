import { NextRequest, NextResponse } from "next/server";
import { adminMutation, getAdminOrders, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const data = await getAdminOrders({
      status: params.get("status") || "",
      search: params.get("search") || "",
      after: params.get("after") || undefined,
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Admin orders GET:", error);
    return NextResponse.json({ error: "خطا در دریافت سفارش‌ها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action || "");
    const map: Record<string, { query: string; permission: AdminPermission }> = {
      addNote: { query: ADMIN_MUTATIONS.addOrderNote, permission: ADMIN_PERMISSIONS.ORDERS_WRITE },
      updateStatus: { query: ADMIN_MUTATIONS.updateOrderStatus, permission: ADMIN_PERMISSIONS.ORDERS_WRITE },
      updateFulfillment: { query: ADMIN_MUTATIONS.updateOrderItemFulfillment, permission: ADMIN_PERMISSIONS.ORDERS_FULFILL },
    };
    if (!map[action]) return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
    const variables = action === "addNote"
      ? { orderId: Number(body.orderId), content: String(body.content || "") }
      : action === "updateStatus"
        ? { orderId: Number(body.orderId), status: String(body.status || "") }
        : { orderId: Number(body.orderId), itemId: Number(body.itemId), status: String(body.status || "") };
    const data = await adminMutation(map[action].query, variables, map[action].permission);
    return NextResponse.json(data ?? { success: false });
  } catch (error) {
    console.error("Admin orders POST:", error);
    return NextResponse.json({ error: "عملیات سفارش انجام نشد" }, { status: 500 });
  }
}
