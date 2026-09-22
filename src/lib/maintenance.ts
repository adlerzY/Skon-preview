import "server-only";
import { fetchGraphQL } from "@/lib/graphql";
import { SITE_MAINTENANCE_QUERY, SITE_NOTICE_QUERY } from "@/lib/graphql/admin";
import { getCurrentUser } from "@/lib/auth/session";

export const MAINTENANCE_CACHE_TAG = "site-maintenance";
export const SITE_NOTICE_CACHE_TAG = "site-notice";
export const BYPASS_COOKIE = "a2b_maintenance_bypass";
export interface MaintenanceSettings {
  enabled: boolean;
  title: string;
  description: string;
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  const data = await fetchGraphQL(
    SITE_MAINTENANCE_QUERY,
    {},
    [MAINTENANCE_CACHE_TAG],
    "no-store",
  );
  const settings = data?.siteMaintenanceSettings;
  return {
    enabled: settings?.enabled === true,
    title: settings?.title || "سایت در حال به‌روزرسانی است",
    description: settings?.description || "در حال اعمال تغییرات و بهبودهای سایت هستیم. لطفاً چند دقیقه بعد دوباره مراجعه کنید.",
  };
}

export async function hasMaintenanceBypass(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isStaff === true;
}


export interface SiteNoticeSettings {
  enabled: boolean;
  title: string;
  message: string;
}

export async function getSiteNotice(): Promise<SiteNoticeSettings> {
  const data = await fetchGraphQL(
    SITE_NOTICE_QUERY,
    {},
    [SITE_NOTICE_CACHE_TAG],
    "force-cache",
  );
  const notice = data?.siteNotice;
  return {
    enabled: notice?.enabled === true,
    title: notice?.title || "اطلاعیه سایت",
    message: notice?.message || "",
  };
}
