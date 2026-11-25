import AdminCdKeysClient from "@/components/admin/AdminCdKeysClient";
import { getAdminBootstrap, getAdminCdKeyStockWithContext } from "@/lib/admin/server";

function positive(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const number = Number(raw);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string | string[]; variationId?: string | string[] }>;
}) {
  const query = await searchParams;
  const productId = positive(query.productId);
  const variationId = productId ? positive(query.variationId) : undefined;

  const bootstrap = await getAdminBootstrap();
  const initial = await getAdminCdKeyStockWithContext(bootstrap, { status: "all", productId, variationId });

  return (
    <AdminCdKeysClient
      initial={initial}
      initialProductId={productId ? String(productId) : ""}
      initialVariationId={variationId ? String(variationId) : ""}
    />
  );
}