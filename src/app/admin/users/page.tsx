import AdminUsersClient from "@/components/admin/AdminUsersClient";
import { getAdminBootstrap, getAdminUsersWithContext } from "@/lib/admin/server";

export default async function Page() {
  const bootstrap = await getAdminBootstrap();
  const initial = await getAdminUsersWithContext(bootstrap, { segment: "all", order: "desc" });
  return <AdminUsersClient initial={initial} />;
}