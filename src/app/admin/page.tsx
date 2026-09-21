import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAdminBootstrap, getAdminDashboardWithContext } from "@/lib/admin/server";

export default async function Page() {
  const bootstrap = await getAdminBootstrap();
  const initial = await getAdminDashboardWithContext(bootstrap);
  return <AdminDashboard initial={initial} />;
}
