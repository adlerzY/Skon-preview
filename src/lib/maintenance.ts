import "server-only";
import { unstable_cache } from "next/cache";
import { fetchGraphQL } from "@/lib/graphql";
import { SITE_MAINTENANCE_QUERY, SITE_NOTICE_QUERY } from "@/lib/graphql/admin";

export const MAINTENANCE_CACHE_TAG = "site-maintenance";
export const SITE_NOTICE_CACHE_TAG = "site-notice";
export const BYPASS_COOKIE = "a2b_maintenance_bypass";

export interface MaintenanceSettings {
  enabled: boolean;
  title: string;
  description: string;
}

const loadMaintenanceSettings = unstable_cache(
  async (): Promise<MaintenanceSettings> => {
    const data = await fetchGraphQL(
      SITE_MAINTENANCE_QUERY,
      {},
      [MAINTENANCE_CACHE_TAG],
      { type: "revalidate", seconds: 60 },
    );
    const settings = data?.siteMaintenanceSettings;
    return {
      enabled: settings?.enabled === true,
      title: settings?.title || "سایت در حال به‌روزرسانی است",
      description: settings?.description || "در حال اعمال تغییرات و بهبودهای سایت هستیم. لطفاً چند دقیقه بعد دوباره مراجعه کنید.",
    };
  },
  ["site-maintenance-settings"],
  { tags: [MAINTENANCE_CACHE_TAG], revalidate: 60 },
);

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  return loadMaintenanceSettings();
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
    { type: "revalidate", seconds: 300 },
  );
  const notice = data?.siteNotice;
  return {
    enabled: notice?.enabled === true,
    title: notice?.title || "اطلاعیه سایت",
    message: notice?.message || "",
  };
}
