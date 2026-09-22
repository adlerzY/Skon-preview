import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/server";
import { fetchGraphQL } from "@/lib/graphql";
import { ADMIN_SET_SITE_NOTICE_MUTATION, SITE_NOTICE_QUERY } from "@/lib/graphql/admin";
import { getAdminGraphQLHeaders } from "@/lib/admin/headers";
import { getAuthToken } from "@/lib/auth/session";

export async function GET() {
  await requireAdmin();
  const token = (await getAuthToken()) || undefined;
  const data = await fetchGraphQL(
    SITE_NOTICE_QUERY,
    {},
    [],
    "no-store",
    token,
    undefined,
    undefined,
    undefined,
    getAdminGraphQLHeaders(),
  );
  const notice = data?.siteNotice;
  return NextResponse.json({
    enabled: notice?.enabled === true,
    title: notice?.title || "",
    message: notice?.message || "",
  });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const enabled = body?.enabled === true;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (enabled && (!title || !message)) {
    return NextResponse.json({ error: "برای فعال کردن اعلان، عنوان و متن آن را وارد کنید" }, { status: 400 });
  }

  const token = (await getAuthToken()) || undefined;
  const data = await fetchGraphQL(
    ADMIN_SET_SITE_NOTICE_MUTATION,
    { enabled, title, message },
    [],
    "no-store",
    token,
    undefined,
    undefined,
    undefined,
    getAdminGraphQLHeaders(),
  );
  const result = data?.setSiteNotice;

  if (!result?.success) {
    return NextResponse.json({ error: "ذخیره اعلان سایت انجام نشد" }, { status: 500 });
  }

  revalidateTag("site-notice", { expire: 0 });
  revalidatePath("/", "layout");

  return NextResponse.json({
    enabled: result.enabled === true,
    title: result.title || title,
    message: result.message || message,
  });
}
