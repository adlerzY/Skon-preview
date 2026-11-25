import { notFound } from "next/navigation";
import AdminUserDetail from "@/components/admin/AdminUserDetail";
import { getAdminBootstrap, getAdminUserWithContext } from "@/lib/admin/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const bootstrap = await getAdminBootstrap();
  const data = await getAdminUserWithContext(bootstrap, userId);
  if (!data) notFound();

  return <AdminUserDetail data={data} permissions={bootstrap.permissions} />;
}