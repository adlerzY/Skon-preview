import { redirect } from "next/navigation";
import { headers } from "next/headers";
import MaintenancePage from "@/components/MaintenancePage";
import { getMaintenanceSettings } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export default async function MaintenanceRoute() {
  const requestHeaders = await headers();
  const viaProxy = requestHeaders.get("x-a2b-maintenance-enabled") === "1";

  if (viaProxy) {
    return (
      <MaintenancePage
        title={requestHeaders.get("x-a2b-maintenance-title") || "سایت در حال به‌روزرسانی است"}
        description={requestHeaders.get("x-a2b-maintenance-description") || "در حال اعمال تغییرات و بهبودهای سایت هستیم. لطفاً چند دقیقه بعد دوباره مراجعه کنید."}
      />
    );
  }

  const maintenance = await getMaintenanceSettings();
  if (!maintenance.enabled) redirect("/");

  return <MaintenancePage title={maintenance.title} description={maintenance.description} />;
}
