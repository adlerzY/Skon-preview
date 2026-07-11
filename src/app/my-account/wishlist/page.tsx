import { cookies } from "next/headers";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { getWishlistProductIds, getProductsByIds } from "@/lib/graphql";
import WishlistGrid from "@/components/account/WishlistGrid";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const token = await getAuthToken();
  const cookieStore = await cookies();
  const activeRegion = cookieStore.get("store_region")?.value || "eu";

  const ids = await getWishlistProductIds(token);
  const products = await getProductsByIds(ids, activeRegion);

  return (
    <div>
      <h1 className="text-xl font-black text-white mb-6">علاقه‌مندی‌های من</h1>
      <WishlistGrid initialProducts={products} activeRegion={activeRegion} />
    </div>
  );
}