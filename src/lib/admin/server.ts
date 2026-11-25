import "server-only";
import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuthToken, getCurrentAdminUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import {
  ADMIN_BOOTSTRAP_QUERY,
  ADMIN_CLAIM_TICKET_MUTATION,
  ADMIN_DASHBOARD_QUERY,
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
  ADMIN_CDKEY_STOCK_QUERY,
  ADMIN_IMPORT_CDKEYS_MUTATION,
  ADMIN_DELETE_CDKEY_MUTATION,
  ADMIN_ASSIGN_CDKEYS_MUTATION,
  ADMIN_ASSIGN_CDKEY_MANUALLY_MUTATION,
  ADMIN_REVEAL_CDKEYS_MUTATION,
} from "@/lib/graphql/admin";
import { resolveAvatarUrl } from "@/lib/avatars";
import type { AdminPermission } from "./permissions";
import { getAdminGraphQLHeaders } from "./headers";

const ACCESS_TTL_MS = 20_000;
const ACCESS_CACHE_LIMIT = 500;
const accessCache = new Map<string, { permissions: string[]; expiresAt: number }>();

export const ADMIN_UNREAD_COUNT_QUERY = `query GetAdminUnreadCount { adminUnreadNotificationsCount }`;

export class AdminAccessError extends Error {
  readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
  }
}

async function resolveAdminAccess(): Promise<{ permissions: string[] } | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const key = createHash("sha256").update(token).digest("hex");
  const now = Date.now();
  const hit = accessCache.get(key);
  if (hit && hit.expiresAt > now) return { permissions: hit.permissions };

  const user = await getCurrentAdminUser();
  if (!user?.isStaff) {
    accessCache.delete(key);
    return null;
  }

  if (accessCache.size >= ACCESS_CACHE_LIMIT) {
    for (const [cacheKey, entry] of accessCache) {
      if (entry.expiresAt <= now) accessCache.delete(cacheKey);
    }
    if (accessCache.size >= ACCESS_CACHE_LIMIT) accessCache.clear();
  }

  const permissions = user.adminPermissions ?? [];
  accessCache.set(key, { permissions, expiresAt: now + ACCESS_TTL_MS });
  return { permissions };
}

export async function requireAdmin(permission?: AdminPermission): Promise<{ permissions: string[] }> {
  const access = await resolveAdminAccess();
  if (!access) redirect("/admin-login");
  if (permission && !access.permissions.includes(permission)) redirect("/admin");
  return access;
}

export async function assertAdminApi(permission?: AdminPermission): Promise<{ permissions: string[] }> {
  const access = await resolveAdminAccess();
  if (!access) throw new AdminAccessError("دسترسی غیرمجاز", 401);
  if (permission && !access.permissions.includes(permission)) throw new AdminAccessError("دسترسی غیرمجاز", 403);
  return access;
}

async function adminFetch<T = any>(query: string, variables: Record<string, unknown> = {}) {
  const token = (await getAuthToken()) || undefined;
  return fetchGraphQL(query, variables, [], "no-store", token, undefined, undefined, undefined, getAdminGraphQLHeaders()) as T;
}

export function adminQuery<T = any>(query: string, variables: Record<string, unknown> = {}) {
  return adminFetch<T>(query, variables);
}

export async function adminAction(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<{ data: any; errorMessage: string | null }> {
  const token = (await getAuthToken()) || undefined;
  return fetchGraphQLWithErrors(query, variables, token, undefined, undefined, undefined, getAdminGraphQLHeaders());
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

export async function getAdminDashboardWithContext(bootstrap: AdminBootstrap) {
  if (!bootstrap?.user?.id) redirect("/admin-login");

  const includeTickets = bootstrap.permissions.includes("tickets.read");
  const data = await adminFetch(
    includeTickets ? ADMIN_DASHBOARD_QUERY : ADMIN_DASHBOARD_SUMMARY_QUERY,
    includeTickets ? { first: 6 } : {},
  );

  return {
    summary: {
      openTicketsCount: Number(data?.adminOpenTicketsCount ?? 0),
      pendingReviewsCount: Number(data?.pendingReviewsCount ?? 0),
      processingOrdersCount: Number(data?.adminProcessingOrdersCount ?? 0),
    },
    pricingHealth: data?.adminPricingHealth ?? null,
    tickets: includeTickets && Array.isArray(data?.adminOpenTickets) ? data.adminOpenTickets : [],
  };
}

export async function getAdminDashboard() {
  const bootstrap = await getAdminBootstrap();
  return getAdminDashboardWithContext(bootstrap);
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
  deleteCdKey: ADMIN_DELETE_CDKEY_MUTATION,
  assignCdKeys: ADMIN_ASSIGN_CDKEYS_MUTATION,
  assignCdKeyManually: ADMIN_ASSIGN_CDKEY_MANUALLY_MUTATION,
  revealCdKeys: ADMIN_REVEAL_CDKEYS_MUTATION,
};