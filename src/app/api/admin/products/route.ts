import { NextRequest } from "next/server";
import { adminFail, adminJson, positiveInt, runAdmin } from "@/lib/admin/api";
import { adminQuery, assertAdminApiAny } from "@/lib/admin/server";
import { ADMIN_PRODUCTS_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

const STATUSES = new Set(["all", "publish", "draft", "private", "pending"]);
const SORTS = new Set(["date", "title"]);

export function GET(request: NextRequest) {
  return runAdmin(undefined, "خطا در دریافت محصولات", async () => {
    await assertAdminApiAny([ADMIN_PERMISSIONS.PRODUCTS_READ, ADMIN_PERMISSIONS.CDKEYS_READ]);

    const params = request.nextUrl.searchParams;
    const status = params.get("status") || "all";
    const sort = params.get("sort") || "date";

    const data = await adminQuery(ADMIN_PRODUCTS_QUERY, {
      first: Math.min(positiveInt(params.get("first")) ?? 20, 50),
      status: STATUSES.has(status) ? status : "all",
      sort: SORTS.has(sort) ? sort : "date",
      order: params.get("order") === "asc" ? "asc" : "desc",
      search: (params.get("search") || "").trim().slice(0, 100),
      after: params.get("after") || undefined,
    });

    if (!data) return adminFail("خطا در دریافت محصولات", 502);
    return adminJson(data.adminProducts ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } });
  });
}