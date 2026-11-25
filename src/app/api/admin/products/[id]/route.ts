import { adminFail, adminJson, positiveInt, runAdmin } from "@/lib/admin/api";
import { adminQuery, assertAdminApiAny } from "@/lib/admin/server";
import { ADMIN_PRODUCT_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  return runAdmin(undefined, "خطا در دریافت محصول", async () => {
    await assertAdminApiAny([ADMIN_PERMISSIONS.PRODUCTS_READ, ADMIN_PERMISSIONS.CDKEYS_READ]);

    const id = positiveInt((await context.params).id);
    if (!id) return adminFail("شناسه نامعتبر است", 400);

    const data = await adminQuery(ADMIN_PRODUCT_QUERY, { id });
    if (!data) return adminFail("خطا در دریافت محصول", 502);
    if (!data.adminProduct) return adminFail("محصول یافت نشد", 404);
    return adminJson(data.adminProduct);
  });
}