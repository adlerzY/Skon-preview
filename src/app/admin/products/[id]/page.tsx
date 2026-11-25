import { notFound } from "next/navigation";
import AdminProductDetail from "@/components/admin/AdminProductDetail";
import { getAdminBootstrap, getAdminProductWithContext } from "@/lib/admin/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const bootstrap = await getAdminBootstrap();
  const data = await getAdminProductWithContext(bootstrap, productId);
  if (!data) notFound();

  return <AdminProductDetail data={data} permissions={bootstrap.permissions} />;
}