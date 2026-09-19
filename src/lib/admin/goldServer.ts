import "server-only";
import { redirect } from "next/navigation";
import { getAuthToken, getCurrentAdminUser } from "@/lib/auth/session";
import type { AdminBootstrap } from "@/lib/admin/server";
import { fetchGraphQL } from "@/lib/graphql";
import { getAdminGraphQLHeaders } from "./headers";
import { ADMIN_ADD_GOLD_STRIKE, ADMIN_CLAIM_GOLD_PROPOSAL, ADMIN_CONFIRM_GOLD_RECEIVED, ADMIN_CREATE_GOLD_BUY_ORDER, ADMIN_GOLD_BOARD_QUERY, ADMIN_RECORD_GOLD_PAYOUT, ADMIN_START_GOLD_DEAL, ADMIN_UPDATE_GOLD_DEAL_STATUS } from "@/lib/graphql/adminGold";

async function requireGold(permission: "gold.read" | "gold.write" | "gold.claim" | "gold.payout") {
  const user = await getCurrentAdminUser();
  if (!user?.isStaff) redirect("/admin-login");
  const permissions = user.adminPermissions ?? [];
  if (!permissions.includes(permission)) redirect("/admin");
  return user;
}

async function fetchAdmin(query: string, variables: Record<string, unknown> = {}) {
  const token = (await getAuthToken()) || undefined;
  return fetchGraphQL(query, variables, [], "no-store", token, undefined, undefined, undefined, getAdminGraphQLHeaders());
}

function assertGoldBootstrapAccess(bootstrap: AdminBootstrap, permission: "gold.read" | "gold.write" | "gold.claim" | "gold.payout"): void {
  if (!bootstrap?.user?.id) redirect("/admin-login");
  if (!bootstrap.permissions.includes(permission)) redirect("/admin");
}

export async function getGoldBoardWithContext(bootstrap: AdminBootstrap) {
  assertGoldBootstrapAccess(bootstrap, "gold.read");
  return fetchAdmin(ADMIN_GOLD_BOARD_QUERY, { status: "all", first: 30 });
}

export async function getGoldBoard() {
  await requireGold("gold.read");
  return fetchAdmin(ADMIN_GOLD_BOARD_QUERY, { status: "all", first: 30 });
}

export async function goldMutation(action: string, variables: Record<string, unknown>) {
  const permission = action === "claim" || action === "start" ? "gold.claim" : action === "payout" ? "gold.payout" : "gold.write";
  await requireGold(permission);
  const map: Record<string, string> = { create: ADMIN_CREATE_GOLD_BUY_ORDER, claim: ADMIN_CLAIM_GOLD_PROPOSAL, start: ADMIN_START_GOLD_DEAL, status: ADMIN_UPDATE_GOLD_DEAL_STATUS, confirm: ADMIN_CONFIRM_GOLD_RECEIVED, payout: ADMIN_RECORD_GOLD_PAYOUT, strike: ADMIN_ADD_GOLD_STRIKE };
  if (!map[action]) throw new Error("عملیات Gold نامعتبر است.");
  return fetchAdmin(map[action], variables);
}
