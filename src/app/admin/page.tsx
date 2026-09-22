import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAdminBootstrap, getAdminDashboardWithContext } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const bootstrap = await getAdminBootstrap();
  const initial = await getAdminDashboardWithContext(bootstrap);
  return <AdminDashboard initial={initial} />;
}
