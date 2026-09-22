import type { ReactNode } from "react";
import CommerceProviders from "@/components/providers/CommerceProviders";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";
import MaintenancePage from "@/components/MaintenancePage";
import { hasMaintenanceBypass, isMaintenanceEnabled } from "@/lib/maintenance";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const maintenanceEnabled = await isMaintenanceEnabled();

  if (maintenanceEnabled && !(await hasMaintenanceBypass())) {
    return <MaintenancePage />;
  }

  return (
    <CommerceProviders>
      <div className="pb-[calc(58px+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <ScrollToTopButton />
    </CommerceProviders>
  );
}
