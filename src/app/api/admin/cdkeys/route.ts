import { NextRequest } from "next/server";
import { adminFail, adminJson, positiveInt, runAdmin, runMutation } from "@/lib/admin/api";
import { adminQuery, assertAdminApi, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_CDKEY_STOCK_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";
import { readJsonBody } from "@/lib/requestBody";

const STATUSES = new Set(["all", "available", "reserved", "used", "duplicate", "decrypt_failed", "failed"]);

interface ActionSpec {
  permission: AdminPermission;
  query: string;
  key: string;
  variables: (body: any) => Record<string, unknown> | null;
}

const ACTIONS: Record<string, ActionSpec> = {
  import: {
    permission: ADMIN_PERMISSIONS.CDKEYS_WRITE,
    query: ADMIN_MUTATIONS.importCdKeys,
    key: "adminImportCdKeys",
    variables: (body) => {
      const productId = positiveInt(body?.productId);
      const variationId = positiveInt(body?.variationId);
      const keys = String(body?.keys ?? "");
      return productId && variationId && keys.trim() ? { productId, variationId, keys } : null;
    },
  },
  delete: {
    permission: ADMIN_PERMISSIONS.CDKEYS_WRITE,
    query: ADMIN_MUTATIONS.deleteCdKey,
    key: "adminDeleteCdKey",
    variables: (body) => {
      const stockId = positiveInt(body?.stockId);
      return stockId ? { stockId } : null;
    },
  },
  assign: {
    permission: ADMIN_PERMISSIONS.CDKEYS_WRITE,
    query: ADMIN_MUTATIONS.assignCdKeys,
    key: "adminAssignCdKeys",
    variables: (body) => {
      const orderId = positiveInt(body?.orderId);
      const itemId = positiveInt(body?.itemId);
      const quantity = positiveInt(body?.quantity);
      return orderId && itemId && quantity ? { orderId, itemId, quantity } : null;
    },
  },
  manualAssign: {
    permission: ADMIN_PERMISSIONS.CDKEYS_WRITE,
    query: ADMIN_MUTATIONS.assignCdKeyManually,
    key: "adminAssignCdKeyManually",
    variables: (body) => {
      const orderId = positiveInt(body?.orderId);
      const itemId = positiveInt(body?.itemId);
      const key = String(body?.key ?? "").trim();
      return orderId && itemId && key ? { orderId, itemId, key } : null;
    },
  },
  reveal: {
    permission: ADMIN_PERMISSIONS.CDKEYS_REVEAL,
    query: ADMIN_MUTATIONS.revealCdKeys,
    key: "adminRevealCdKeys",
    variables: (body) => {
      const orderId = positiveInt(body?.orderId);
      const itemId = positiveInt(body?.itemId);
      return orderId && itemId ? { orderId, itemId } : null;
    },
  },
};

export function GET(request: NextRequest) {
  return runAdmin(ADMIN_PERMISSIONS.CDKEYS_READ, "خطا در دریافت موجودی CD Key", async () => {
    const params = request.nextUrl.searchParams;
    const requested = params.get("status") || "all";
    const data = await adminQuery(ADMIN_CDKEY_STOCK_QUERY, {
      first: 30,
      status: STATUSES.has(requested) ? requested : "all",
      productId: positiveInt(params.get("productId")) ?? undefined,
      variationId: positiveInt(params.get("variationId")) ?? undefined,
      after: params.get("after") || undefined,
    });
    if (!data) return adminFail("خطا در دریافت موجودی CD Key", 502);
    return adminJson(
      data.adminCdKeyStock ?? {
        nodes: [],
        pageInfo: { hasNextPage: false, endCursor: null },
        summary: { available: 0, reserved: 0, used: 0, failed: 0, total: 0 },
      }
    );
  });
}

export function POST(request: NextRequest) {
  return runAdmin(undefined, "عملیات CD Key انجام نشد", async () => {
    const body = await readJsonBody(request, 1024 * 1024);
    const spec = ACTIONS[String(body?.action || "")];
    if (!spec) return adminFail("عملیات نامعتبر است", 400);
    await assertAdminApi(spec.permission);
    const variables = spec.variables(body);
    if (!variables) return adminFail("اطلاعات ارسالی نامعتبر است", 400);
    return runMutation(spec.query, variables, spec.key, "عملیات CD Key انجام نشد");
  });
}