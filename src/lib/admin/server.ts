import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuthToken, getCurrentAdminUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import {
  ADMIN_BOOTSTRAP_QUERY,
  ADMIN_CLAIM_TICKET_MUTATION,
  ADMIN_CUSTOMER_QUERY,
  ADMIN_CUSTOMERS_QUERY,
  ADMIN_DASHBOARD_SUMMARY_QUERY,
  ADMIN_MODERATE_REVIEW_MUTATION,
  ADMIN_NOTIFICATIONS_QUERY,
  ADMIN_ORDER_QUERY,
  ADMIN_ORDERS_QUERY,
  ADMIN_REPLY_REVIEW_MUTATION,
  ADMIN_REPLY_TICKET_MUTATION,
  ADMIN_ADD_TICKET_NOTE_MUTATION,
  ADMIN_SET_TICKET_STATUS_MUTATION,
  ADMIN_ADD_ORDER_NOTE_MUTATION,
  ADMIN_UPDATE_ORDER_STATUS_MUTATION,
  ADMIN_UPDATE_ORDER_ITEM_FULFILLMENT_MUTATION,
  ADMIN_REASSIGN_TICKET_MUTATION,
  ADMIN_REVIEWS_QUERY,
  ADMIN_TICKET_QUERY,
  ADMIN_TICKETS_QUERY,
  ADMIN_STAFF_USERS_QUERY,
  ADMIN_OPEN_TICKETS_QUERY,
  ADMIN_CDKEY_STOCK_QUERY,
  ADMIN_IMPORT_CDKEYS_MUTATION,
  ADMIN_ASSIGN_CDKEYS_MUTATION,
  ADMIN_ASSIGN_CDKEY_MANUALLY_MUTATION,
  ADMIN_REVEAL_CDKEYS_MUTATION,
} from "@/lib/graphql/admin";
import { resolveAvatarUrl } from "@/lib/avatars";
import type { AdminPermission } from "./permissions";
import { getAdminGraphQLHeaders } from "./headers";

export async function requireAdmin(permission?: AdminPermission): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentAdminUser>>>; permissions: string[] }> {
  const user = await getCurrentAdminUser();
  if (!user?.isStaff) redirect("/admin-login");
  const permissions = user.adminPermissions ?? [];
  if (permission && !permissions.includes(permission)) redirect("/admin");
  return { user, permissions };
}

async function adminFetch<T = any>(query: string, variables: Record<string, unknown> = {}) {
  const token = (await getAuthToken()) || undefined;
  return fetchGraphQL(query, variables, [], "no-store", token, undefined, undefined, undefined, getAdminGraphQLHeaders()) as T;
}

export interface AdminBootstrap {
  user: {
    id: string;
    databaseId: number;
    name: string;
    email: string;
    avatarId: string | null;
    avatarUrl: string | null;
    hasManualPassword: boolean;
  };
  permissions: string[];
}

export const getAdminBootstrap = cache(async (): Promise<AdminBootstrap> => {
  const data = await adminFetch(ADMIN_BOOTSTRAP_QUERY);
  const viewer = data?.viewer;
  if (!viewer?.id || viewer?.isStaff !== true) redirect("/admin-login");
  const permissions = Array.isArray(viewer.adminPermissions) ? viewer.adminPermissions : [];

  return {
    user: {
      id: viewer.id,
      databaseId: Number(viewer.databaseId ?? 0),
      name: String(viewer.name ?? ""),
      email: String(viewer.email ?? ""),
      avatarId: viewer.avatarUrl ? String(viewer.avatarUrl) : null,
      avatarUrl: await resolveAvatarUrl(viewer.avatarUrl ? String(viewer.avatarUrl) : null),
      hasManualPassword: Boolean(viewer.hasManualPassword),
    },
    permissions,
  };
});

export async function getAdminOpenTickets(first = 6) {
  await requireAdmin("tickets.read");
  const data = await adminFetch(ADMIN_OPEN_TICKETS_QUERY, { first: Math.min(Math.max(first, 1), 20) });
  return Array.isArray(data?.adminOpenTickets) ? data.adminOpenTickets : [];
}

export async function getAdminSummary() {
  const user = await getCurrentAdminUser();
  if (!user?.isStaff) return null;
  const data = await adminFetch(ADMIN_DASHBOARD_SUMMARY_QUERY);
  return {
    openTicketsCount: Number(data?.adminOpenTicketsCount ?? 0),
    pendingReviewsCount: Number(data?.pendingReviewsCount ?? 0),
    processingOrdersCount: Number(data?.adminProcessingOrdersCount ?? 0),
    unreadNotificationsCount: Number(data?.adminUnreadNotificationsCount ?? 0),
  };
}



function assertAdminBootstrapPermission(bootstrap: AdminBootstrap, permission?: AdminPermission): void {
  if (!bootstrap?.user?.id) redirect("/admin-login");
  if (permission && !bootstrap.permissions.includes(permission)) redirect("/admin");
}

export async function getAdminOrdersWithContext(bootstrap: AdminBootstrap, variables: Record<string, unknown> = {}) {
  assertAdminBootstrapPermission(bootstrap, "orders.read");
  const data = await adminFetch(ADMIN_ORDERS_QUERY, { first: 20, ...variables });
  return data?.adminOrders ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminOrderWithContext(bootstrap: AdminBootstrap, id: number) {
  assertAdminBootstrapPermission(bootstrap, "orders.read");
  const data = await adminFetch(ADMIN_ORDER_QUERY, { id });
  return data?.adminOrder ?? null;
}

export async function getAdminTicketsWithContext(bootstrap: AdminBootstrap, variables: Record<string, unknown> = {}) {
  assertAdminBootstrapPermission(bootstrap, "tickets.read");
  const data = await adminFetch(ADMIN_TICKETS_QUERY, { first: 20, ...variables });
  return data?.adminTickets ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminTicketWithContext(bootstrap: AdminBootstrap, id: number) {
  assertAdminBootstrapPermission(bootstrap, "tickets.read");
  const data = await adminFetch(ADMIN_TICKET_QUERY, { id });
  return data?.adminTicket ?? null;
}

export async function getAdminCustomersWithContext(bootstrap: AdminBootstrap, variables: Record<string, unknown> = {}) {
  assertAdminBootstrapPermission(bootstrap, "users.read");
  const data = await adminFetch(ADMIN_CUSTOMERS_QUERY, { first: 20, ...variables });
  return data?.adminCustomers ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminCustomerWithContext(bootstrap: AdminBootstrap, id: number) {
  assertAdminBootstrapPermission(bootstrap, "users.read");
  const data = await adminFetch(ADMIN_CUSTOMER_QUERY, { id });
  return data?.adminCustomer ?? null;
}

export async function getAdminReviewsWithContext(bootstrap: AdminBootstrap, variables: Record<string, unknown> = {}) {
  assertAdminBootstrapPermission(bootstrap, "reviews.moderate");
  const data = await adminFetch(ADMIN_REVIEWS_QUERY, { first: 20, state: "pending", ...variables });
  return data?.adminReviews ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminCdKeyStockWithContext(bootstrap: AdminBootstrap, variables: Record<string, unknown> = {}) {
  assertAdminBootstrapPermission(bootstrap, "cdkeys.read");
  const data = await adminFetch(ADMIN_CDKEY_STOCK_QUERY, { first: 30, status: "all", ...variables });
  return data?.adminCdKeyStock ?? {
    nodes: [],
    pageInfo: { hasNextPage: false, endCursor: null },
    summary: { available: 0, reserved: 0, used: 0, failed: 0, total: 0 },
  };
}

export async function getAdminOrders(variables: Record<string, unknown> = {}) {
  await requireAdmin("orders.read");
  const data = await adminFetch(ADMIN_ORDERS_QUERY, { first: 20, ...variables });
  return data?.adminOrders ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminOrder(id: number) {
  await requireAdmin("orders.read");
  const data = await adminFetch(ADMIN_ORDER_QUERY, { id });
  return data?.adminOrder ?? null;
}

export async function getAdminTickets(variables: Record<string, unknown> = {}) {
  await requireAdmin("tickets.read");
  const data = await adminFetch(ADMIN_TICKETS_QUERY, { first: 20, ...variables });
  return data?.adminTickets ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminTicket(id: number) {
  await requireAdmin("tickets.read");
  const data = await adminFetch(ADMIN_TICKET_QUERY, { id });
  return data?.adminTicket ?? null;
}

export async function getAdminCustomers(variables: Record<string, unknown> = {}) {
  await requireAdmin("users.read");
  const data = await adminFetch(ADMIN_CUSTOMERS_QUERY, { first: 20, ...variables });
  return data?.adminCustomers ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminCustomer(id: number) {
  await requireAdmin("users.read");
  const data = await adminFetch(ADMIN_CUSTOMER_QUERY, { id });
  return data?.adminCustomer ?? null;
}

export async function getAdminReviews(variables: Record<string, unknown> = {}) {
  await requireAdmin("reviews.moderate");
  const data = await adminFetch(ADMIN_REVIEWS_QUERY, { first: 20, state: "pending", ...variables });
  return data?.adminReviews ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } };
}

export async function getAdminStaffUsers() {
  await requireAdmin("tickets.write");
  const data = await adminFetch(ADMIN_STAFF_USERS_QUERY);
  return Array.isArray(data?.adminStaffUsers) ? data.adminStaffUsers : [];
}

export async function getAdminCdKeyStock(variables: Record<string, unknown> = {}) {
  await requireAdmin("cdkeys.read");
  const data = await adminFetch(ADMIN_CDKEY_STOCK_QUERY, { first: 30, status: "all", ...variables });
  return data?.adminCdKeyStock ?? {
    nodes: [],
    pageInfo: { hasNextPage: false, endCursor: null },
    summary: { available: 0, reserved: 0, used: 0, failed: 0, total: 0 },
  };
}

export async function getAdminNotifications(unreadOnly = false) {
  await requireAdmin();
  const data = await adminFetch(ADMIN_NOTIFICATIONS_QUERY, { first: 20, unreadOnly });
  return Array.isArray(data?.adminNotifications) ? data.adminNotifications : [];
}

export async function adminMutation(
  query: string,
  variables: Record<string, unknown> = {},
  permission?: AdminPermission,
) {
  await requireAdmin(permission);
  return adminFetch(query, variables);
}

export const ADMIN_MUTATIONS = {
  claimTicket: ADMIN_CLAIM_TICKET_MUTATION,
  replyTicket: ADMIN_REPLY_TICKET_MUTATION,
  addTicketNote: ADMIN_ADD_TICKET_NOTE_MUTATION,
  setTicketStatus: ADMIN_SET_TICKET_STATUS_MUTATION,
  reassignTicket: ADMIN_REASSIGN_TICKET_MUTATION,
  moderateReview: ADMIN_MODERATE_REVIEW_MUTATION,
  replyReview: ADMIN_REPLY_REVIEW_MUTATION,
  addOrderNote: ADMIN_ADD_ORDER_NOTE_MUTATION,
  updateOrderStatus: ADMIN_UPDATE_ORDER_STATUS_MUTATION,
  updateOrderItemFulfillment: ADMIN_UPDATE_ORDER_ITEM_FULFILLMENT_MUTATION,
  importCdKeys: ADMIN_IMPORT_CDKEYS_MUTATION,
  assignCdKeys: ADMIN_ASSIGN_CDKEYS_MUTATION,
  assignCdKeyManually: ADMIN_ASSIGN_CDKEY_MANUALLY_MUTATION,
  revealCdKeys: ADMIN_REVEAL_CDKEYS_MUTATION,
};
