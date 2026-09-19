import { NextRequest, NextResponse } from "next/server";
import { adminMutation, getAdminTickets, getAdminStaffUsers, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    if (params.get("staff") === "1") {
      const staff = await getAdminStaffUsers();
      return NextResponse.json({ staff }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const data = await getAdminTickets({
      status: params.get("status") || "",
      search: params.get("search") || "",
      mineOnly: params.get("mineOnly") === "true",
      after: params.get("after") || undefined,
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Admin tickets GET:", error);
    return NextResponse.json({ error: "خطا در دریافت تیکت‌ها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action || "");
    const map: Record<string, { query: string; permission: AdminPermission }> = {
      claim: { query: ADMIN_MUTATIONS.claimTicket, permission: ADMIN_PERMISSIONS.TICKETS_CLAIM },
      reply: { query: ADMIN_MUTATIONS.replyTicket, permission: ADMIN_PERMISSIONS.TICKETS_WRITE },
      note: { query: ADMIN_MUTATIONS.addTicketNote, permission: ADMIN_PERMISSIONS.TICKETS_WRITE },
      status: { query: ADMIN_MUTATIONS.setTicketStatus, permission: ADMIN_PERMISSIONS.TICKETS_WRITE },
      reassign: { query: ADMIN_MUTATIONS.reassignTicket, permission: ADMIN_PERMISSIONS.TICKETS_CLAIM },
    };
    if (!map[action]) return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
    let variables: Record<string, unknown>;
    if (action === "claim") variables = { ticketId: Number(body.ticketId) };
    else if (action === "reply" || action === "note") variables = { ticketId: Number(body.ticketId), content: String(body.content || "") };
    else if (action === "status") variables = { ticketId: Number(body.ticketId), status: String(body.status || "") };
    else variables = { ticketId: Number(body.ticketId), adminUserId: Number(body.adminUserId) };
    const data = await adminMutation(map[action].query, variables, map[action].permission);
    return NextResponse.json(data ?? { success: false });
  } catch (error) {
    console.error("Admin tickets POST:", error);
    return NextResponse.json({ error: "عملیات تیکت انجام نشد" }, { status: 500 });
  }
}
