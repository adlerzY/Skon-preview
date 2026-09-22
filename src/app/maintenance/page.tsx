import { redirect } from "next/navigation";
import MaintenancePage from "@/components/MaintenancePage";
import { getMaintenanceSettings } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export default async function MaintenanceRoute() {
  const maintenance = await getMaintenanceSettings();
  if (!maintenance.enabled) redirect("/");

  return <MaintenancePage title={maintenance.title} description={maintenance.description} />;
}
