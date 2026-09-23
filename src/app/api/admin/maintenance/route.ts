import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/server";
import { fetchGraphQL } from "@/lib/graphql";
import { ADMIN_SET_MAINTENANCE_MUTATION, SITE_MAINTENANCE_QUERY } from "@/lib/graphql/admin";
import { getAdminGraphQLHeaders } from "@/lib/admin/headers";
import { getAuthToken } from "@/lib/auth/session";
import { setProxyMaintenanceState } from "@/lib/maintenanceProxyState";

export async function GET() {
  await requireAdmin();
  const token = (await getAuthToken()) || undefined;
  const data = await fetchGraphQL(SITE_MAINTENANCE_QUERY, {}, [], "no-store", token, undefined, undefined, undefined, getAdminGraphQLHeaders());
  const settings = data?.siteMaintenanceSettings;
  return NextResponse.json({
    enabled: settings?.enabled === true,
    title: settings?.title || "",
    description: settings?.description || "",
  });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const enabled = body?.enabled === true;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!title || !description) return NextResponse.json({ error: "عنوان و توضیح حالت تعمیرات الزامی است" }, { status: 400 });
  const token = (await getAuthToken()) || undefined;
  const data = await fetchGraphQL(ADMIN_SET_MAINTENANCE_MUTATION, { enabled, title, description }, [], "no-store", token, undefined, undefined, undefined, getAdminGraphQLHeaders());
  const result = data?.setSiteMaintenanceMode;
  if (!result?.success) return NextResponse.json({ error: "تغییر وضعیت تعمیرات انجام نشد" }, { status: 500 });

  setProxyMaintenanceState({
    enabled: Boolean(result.enabled),
    title: result.title || title,
    description: result.description || description,
  });
  revalidateTag("site-maintenance", { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({
    enabled: Boolean(result.enabled),
    title: result.title || title,
    description: result.description || description,
  });
}
