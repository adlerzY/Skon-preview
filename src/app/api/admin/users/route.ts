import { NextRequest } from "next/server";
import { adminFail, adminJson, runAdmin } from "@/lib/admin/api";
import { adminQuery } from "@/lib/admin/server";
import { ADMIN_USERS_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

const SEGMENTS = new Set(["all", "customers", "staff"]);

export function GET(request: NextRequest) {
  return runAdmin(ADMIN_PERMISSIONS.USERS_READ, "خطا در دریافت کاربران", async () => {
    const params = request.nextUrl.searchParams;
    const segment = params.get("segment") || "all";
    const data = await adminQuery(ADMIN_USERS_QUERY, {
      first: 20,
      segment: SEGMENTS.has(segment) ? segment : "all",
      search: (params.get("search") || "").trim().slice(0, 100),
      order: params.get("order") === "asc" ? "asc" : "desc",
      after: params.get("after") || undefined,
    });
    if (!data) return adminFail("خطا در دریافت کاربران", 502);
    return adminJson(data.adminUsers ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } });
  });
}