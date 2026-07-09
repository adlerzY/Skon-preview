import { cookies } from "next/headers";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import WishlistGrid from "@/components/account/WishlistGrid";
import { fetchGraphQL, formatProducts, PRODUCT_CARD_FIELDS } from "@/lib/graphql";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const token = await getAuthToken();
  const cookieStore = await cookies();
  const activeRegion = cookieStore.get("store_region")?.value || "eu";

  const data = await fetchGraphQL(
    `
      ${PRODUCT_CARD_FIELDS}
      query GetWishlist {
        viewer {
          wishlist {
            ...ProductCardFields
          }
        }
      }
    `,
    {},
    [],
    "no-store",
    token || undefined
  );

  const products = formatProducts(data?.viewer?.wishlist ?? [], true, activeRegion);

  return (
    <div>
      <h1 className="text-xl font-black text-white mb-6">علاقه‌مندی‌های من</h1>
      <WishlistGrid initialProducts={products} activeRegion={activeRegion} />
    </div>
  );
}