import "server-only";
import { getAuthToken, getCurrentAdminUser } from "@/lib/auth/session";
import type { AdminBootstrap } from "@/lib/admin/server";
import { fetchGraphQL } from "@/lib/graphql";
import { getAdminGraphQLHeaders } from "./headers";
import {
  ADMIN_AUDIT_LOGS_QUERY,
  ADMIN_ENGINE_HEALTH_QUERY,
  ADMIN_FAILED_JOBS_QUERY,
  ADMIN_RETRY_FAILED_JOB_MUTATION,
  ADMIN_RUN_RATE_SYNC_MUTATION,
  ADMIN_SCHEDULE_PRICING_REBUILD_MUTATION,
  ADMIN_SCHEDULE_REVALIDATION_MUTATION,
} from "@/lib/graphql/adminEngine";

async function requireEngineAccess(mode: "read" | "audit") {
  const user = await getCurrentAdminUser();
  if (!user?.isStaff) throw new Error("دسترسی غیرمجاز");
  const permissions = user.adminPermissions ?? [];
  if (mode === "audit" && !permissions.includes("audit.read")) throw new Error("دسترسی غیرمجاز");
  if (
    mode === "read" &&
    !permissions.some((permission) =>
      ["pricing.read", "engine.scheduler", "engine.rates", "engine.revalidation"].includes(permission)
    )
  ) {
    throw new Error("دسترسی غیرمجاز");
  }
  return user;
}

async function engineFetch<T = any>(query: string, variables: Record<string, unknown> = {}) {
  const token = (await getAuthToken()) || undefined;
  return fetchGraphQL(
    query,
    variables,
    [],
    "no-store",
    token,
    undefined,
    undefined,
    undefined,
    getAdminGraphQLHeaders()
  ) as T;
}

function assertEngineBootstrapAccess(bootstrap: AdminBootstrap, mode: "read" | "audit"): void {
  if (!bootstrap?.user?.id) throw new Error("دسترسی غیرمجاز");
  if (mode === "audit" && !bootstrap.permissions.includes("audit.read")) throw new Error("دسترسی غیرمجاز");
  if (
    mode === "read" &&
    !bootstrap.permissions.some((permission) =>
      ["pricing.read", "engine.scheduler", "engine.rates", "engine.revalidation"].includes(permission)
    )
  ) throw new Error("دسترسی غیرمجاز");
}

export async function getAdminEngineWithContext(bootstrap: AdminBootstrap) {
  assertEngineBootstrapAccess(bootstrap, "read");
  const [healthData, failedData] = await Promise.all([
    engineFetch(ADMIN_ENGINE_HEALTH_QUERY),
    engineFetch(ADMIN_FAILED_JOBS_QUERY, { first: 50 }),
  ]);
  return {
    health: healthData?.adminEngineHealth ?? null,
    failedJobs: Array.isArray(failedData?.adminFailedJobs) ? failedData.adminFailedJobs : [],
  };
}

export async function getAdminAuditLogsWithContext(bootstrap: AdminBootstrap, variables: Record<string, unknown> = {}) {
  assertEngineBootstrapAccess(bootstrap, "audit");
  const data = await engineFetch(ADMIN_AUDIT_LOGS_QUERY, {
    first: Math.min(Math.max(Number(variables.first ?? 100), 1), 200),
    action: variables.action ? String(variables.action) : undefined,
    result: variables.result ? String(variables.result) : undefined,
  });
  return Array.isArray(data?.adminAuditLogs) ? data.adminAuditLogs : [];
}

export async function getAdminEngine() {
  await requireEngineAccess("read");
  const [healthData, failedData] = await Promise.all([
    engineFetch(ADMIN_ENGINE_HEALTH_QUERY),
    engineFetch(ADMIN_FAILED_JOBS_QUERY, { first: 50 }),
  ]);
  return {
    health: healthData?.adminEngineHealth ?? null,
    failedJobs: Array.isArray(failedData?.adminFailedJobs) ? failedData.adminFailedJobs : [],
  };
}

export async function getAdminAuditLogs(variables: Record<string, unknown> = {}) {
  await requireEngineAccess("audit");
  const data = await engineFetch(ADMIN_AUDIT_LOGS_QUERY, {
    first: Math.min(Math.max(Number(variables.first ?? 100), 1), 200),
    action: variables.action ? String(variables.action) : undefined,
    result: variables.result ? String(variables.result) : undefined,
  });
  return Array.isArray(data?.adminAuditLogs) ? data.adminAuditLogs : [];
}

export async function adminEngineMutation(action: string, variables: Record<string, unknown> = {}) {
  const user = await getCurrentAdminUser();
  if (!user?.isStaff) throw new Error("دسترسی غیرمجاز");
  const permissions = user.adminPermissions ?? [];
  const rules: Record<string, string> = {
    rateSync: "engine.rates",
    pricingRebuild: "engine.scheduler",
    revalidation: "engine.revalidation",
    retryFailedJob: "engine.scheduler",
  };
  const required = rules[action];
  if (!required || !permissions.includes(required)) throw new Error("دسترسی غیرمجاز");

  const queries: Record<string, string> = {
    rateSync: ADMIN_RUN_RATE_SYNC_MUTATION,
    pricingRebuild: ADMIN_SCHEDULE_PRICING_REBUILD_MUTATION,
    revalidation: ADMIN_SCHEDULE_REVALIDATION_MUTATION,
    retryFailedJob: ADMIN_RETRY_FAILED_JOB_MUTATION,
  };
  return engineFetch(queries[action], variables);
}
