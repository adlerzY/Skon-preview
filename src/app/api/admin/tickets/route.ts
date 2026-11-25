import { NextRequest } from "next/server";
import { adminFail, adminJson, positiveInt, runAdmin, runMutation } from "@/lib/admin/api";
import { adminQuery, assertAdminApi, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_STAFF_USERS_QUERY, ADMIN_TICKETS_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";
import { readJsonBody } from "@/lib/requestBody";

interface ActionSpec {
  permission: AdminPermission;
  query: string;
  key: string;
  variables: (body: any) => Record<string, unknown> | null;
}

const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

const ACTIONS: Record<string, ActionSpec> = {
  claim: {
    permission: ADMIN_PERMISSIONS.TICKETS_CLAIM,
    query: ADMIN_MUTATIONS.claimTicket,
    key: "adminClaimTicket",
    variables: (body) => {
      const ticketId = positiveInt(body?.ticketId);
      return ticketId ? { ticketId } : null;
    },
  },
  reply: {
    permission: ADMIN_PERMISSIONS.TICKETS_WRITE,
    query: ADMIN_MUTATIONS.replyTicket,
    key: "adminReplyToTicket",
    variables: (body) => {
      const ticketId = positiveInt(body?.ticketId);
      const content = text(body?.content, 10000);
      return ticketId && content ? { ticketId, content } : null;
    },
  },
  note: {
    permission: ADMIN_PERMISSIONS.TICKETS_WRITE,
    query: ADMIN_MUTATIONS.addTicketNote,
    key: "adminAddTicketNote",
    variables: (body) => {
      const ticketId = positiveInt(body?.ticketId);
      const content = text(body?.content, 10000);
      return ticketId && content ? { ticketId, content } : null;
    },
  },
  status: {
    permission: ADMIN_PERMISSIONS.TICKETS_WRITE,
    query: ADMIN_MUTATIONS.setTicketStatus,
    key: "adminSetTicketStatus",
    variables: (body) => {
      const ticketId = positiveInt(body?.ticketId);
      const status = text(body?.status, 32);
      return ticketId && status ? { ticketId, status } : null;
    },
  },
  reassign: {
    permission: ADMIN_PERMISSIONS.TICKETS_WRITE,
    query: ADMIN_MUTATIONS.reassignTicket,
    key: "adminReassignTicket",
    variables: (body) => {
      const ticketId = positiveInt(body?.ticketId);
      const adminUserId = positiveInt(body?.adminUserId);
      return ticketId && adminUserId ? { ticketId, adminUserId } : null;
    },
  },
};

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const wantsStaff = params.get("staff") === "1";
  const permission = wantsStaff ? ADMIN_PERMISSIONS.TICKETS_WRITE : ADMIN_PERMISSIONS.TICKETS_READ;

  return runAdmin(permission, "خطا در دریافت تیکت‌ها", async () => {
    if (wantsStaff) {
      const data = await adminQuery(ADMIN_STAFF_USERS_QUERY);
      if (!data) return adminFail("خطا در دریافت لیست پشتیبان‌ها", 502);
      return adminJson({ staff: Array.isArray(data.adminStaffUsers) ? data.adminStaffUsers : [] });
    }

    const data = await adminQuery(ADMIN_TICKETS_QUERY, {
      first: 20,
      status: params.get("status") || "",
      search: text(params.get("search"), 100),
      mineOnly: params.get("mineOnly") === "true",
      after: params.get("after") || undefined,
    });
    if (!data) return adminFail("خطا در دریافت تیکت‌ها", 502);
    return adminJson(data.adminTickets ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } });
  });
}

export function POST(request: NextRequest) {
  return runAdmin(undefined, "عملیات تیکت انجام نشد", async () => {
    const body = await readJsonBody(request, 64 * 1024);
    const spec = ACTIONS[String(body?.action || "")];
    if (!spec) return adminFail("عملیات نامعتبر است", 400);
    await assertAdminApi(spec.permission);
    const variables = spec.variables(body);
    if (!variables) return adminFail("اطلاعات ارسالی نامعتبر است", 400);
    return runMutation(spec.query, variables, spec.key, "عملیات تیکت انجام نشد");
  });
}