import { NextRequest } from "next/server";
import { adminFail, adminJson, positiveInt, runAdmin, runMutation } from "@/lib/admin/api";
import { adminQuery, assertAdminApi, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_ORDERS_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";
import { readJsonBody } from "@/lib/requestBody";

interface ActionSpec {
  permission: AdminPermission;
  query: string;
  key: string;
  variables: (body: any) => Record<string, unknown> | null;
}

const ACTIONS: Record<string, ActionSpec> = {
  addNote: {
    permission: ADMIN_PERMISSIONS.ORDERS_WRITE,
    query: ADMIN_MUTATIONS.addOrderNote,
    key: "adminAddOrderNote",
    variables: (body) => {
      const orderId = positiveInt(body?.orderId);
      const content = String(body?.content ?? "").trim().slice(0, 5000);
      return orderId && content ? { orderId, content } : null;
    },
  },
  updateStatus: {
    permission: ADMIN_PERMISSIONS.ORDERS_WRITE,
    query: ADMIN_MUTATIONS.updateOrderStatus,
    key: "adminUpdateOrderStatus",
    variables: (body) => {
      const orderId = positiveInt(body?.orderId);
      const status = String(body?.status ?? "").trim();
      return orderId && status ? { orderId, status } : null;
    },
  },
  updateFulfillment: {
    permission: ADMIN_PERMISSIONS.ORDERS_FULFILL,
    query: ADMIN_MUTATIONS.updateOrderItemFulfillment,
    key: "adminUpdateOrderItemFulfillment",
    variables: (body) => {
      const orderId = positiveInt(body?.orderId);
      const itemId = positiveInt(body?.itemId);
      const status = String(body?.status ?? "").trim();
      return orderId && itemId && status ? { orderId, itemId, status } : null;
    },
  },
};

export function GET(request: NextRequest) {
  return runAdmin(ADMIN_PERMISSIONS.ORDERS_READ, "خطا در دریافت سفارش‌ها", async () => {
    const params = request.nextUrl.searchParams;
    const data = await adminQuery(ADMIN_ORDERS_QUERY, {
      first: 20,
      status: params.get("status") || "",
      search: (params.get("search") || "").trim().slice(0, 100),
            order: params.get("order") === "asc" ? "asc" : "desc",
      after: params.get("after") || undefined,
    });
    if (!data) return adminFail("خطا در دریافت سفارش‌ها", 502);
    return adminJson(data.adminOrders ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } });
  });
}

export function POST(request: NextRequest) {
  return runAdmin(undefined, "عملیات سفارش انجام نشد", async () => {
    const body = await readJsonBody(request, 16 * 1024);
    const spec = ACTIONS[String(body?.action || "")];
    if (!spec) return adminFail("عملیات نامعتبر است", 400);
    await assertAdminApi(spec.permission);
    const variables = spec.variables(body);
    if (!variables) return adminFail("اطلاعات ارسالی نامعتبر است", 400);
    return runMutation(spec.query, variables, spec.key, "عملیات سفارش انجام نشد");
  });
}