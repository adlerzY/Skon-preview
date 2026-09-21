import { NextRequest, NextResponse } from "next/server";
import { adminMutation, getAdminCdKeyStock, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const data = await getAdminCdKeyStock({
      status: params.get("status") || "all",
      productId: params.get("productId") ? Number(params.get("productId")) : undefined,
      variationId: params.get("variationId") ? Number(params.get("variationId")) : undefined,
      after: params.get("after") || undefined,
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Admin CD Key stock GET:", error);
    return NextResponse.json({ error: "خطا در دریافت موجودی CD Key" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action || "");
    const map: Record<string, string> = {
      import: ADMIN_MUTATIONS.importCdKeys,
      delete: ADMIN_MUTATIONS.deleteCdKey,
      assign: ADMIN_MUTATIONS.assignCdKeys,
      manualAssign: ADMIN_MUTATIONS.assignCdKeyManually,
      reveal: ADMIN_MUTATIONS.revealCdKeys,
    };
    if (!map[action]) return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });

    const variables = action === "import"
      ? { productId: Number(body.productId), variationId: Number(body.variationId), keys: String(body.keys || "") }
      : action === "delete"
        ? { stockId: Number(body.stockId) }
      : action === "assign"
        ? { orderId: Number(body.orderId), itemId: Number(body.itemId), quantity: Number(body.quantity) }
        : action === "manualAssign"
          ? { orderId: Number(body.orderId), itemId: Number(body.itemId), key: String(body.key || "") }
          : { orderId: Number(body.orderId), itemId: Number(body.itemId) };

    const permission = action === "reveal"
      ? ADMIN_PERMISSIONS.CDKEYS_REVEAL
      : ADMIN_PERMISSIONS.CDKEYS_WRITE;
    return NextResponse.json(await adminMutation(map[action], variables, permission), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin CD Key mutation:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "عملیات CD Key انجام نشد" }, { status: 500 });
  }
}
