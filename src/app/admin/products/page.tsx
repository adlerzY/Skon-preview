import AdminProductsClient from "@/components/admin/AdminProductsClient";
import { getAdminBootstrap, getAdminProductsWithContext } from "@/lib/admin/server";

export default async function Page() {
  const bootstrap = await getAdminBootstrap();
  const initial = await getAdminProductsWithContext(bootstrap, { status: "all", sort: "date", order: "desc" });
  return <AdminProductsClient initial={initial} />;
}