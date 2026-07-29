import { notFound } from "next/navigation";
import { getProductDetail, getWishlistProductIds } from "@/lib/graphql";
import { getCurrentUser, getAuthToken } from "@/lib/auth/session";
import ProductPageClient from "@/components/product/ProductPageClient";
import ProductDescriptionSections from "@/components/product/ProductDescriptionSections";
import ProductReviews from "@/components/ProductReviews";

interface ProductPageProps {
  params: Promise<{ region: string; categorySlug: string; productSlug: string }>;
  searchParams: Promise<{ edition?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const { region, productSlug } = await params;
  const { edition } = await searchParams;

  // دریافت موازی اطلاعات محصول، کاربر و توکن احراز هویت برای حداکثر سرعت
  const [product, user, token] = await Promise.all([
    getProductDetail(productSlug, region),
    getCurrentUser().catch(() => null),
    getAuthToken().catch(() => null),
  ]);

  if (!product) notFound();

  // دریافت لیست علاقه مندی ها در صورت لاگین بودن کاربر
  const wishlistIds = token ? await getWishlistProductIds(token).catch(() => []) : [];
  const isLoggedIn = Boolean(user);
  const isStaff = Boolean(user?.isStaff);
  const initialInWishlist = wishlistIds.includes(product.databaseId);

  const { secondaryGallery, description, reviews, reviewCount, averageRating } = product;

  return (
    <main className="container mx-auto px-6 max-w-site py-8">
      <ProductPageClient
        product={{
          ...product,
          secondaryGallery: undefined,
          description: undefined,
          reviews: undefined,
          reviewCount: undefined,
          averageRating: undefined,
        }}
        initialEdition={edition}
        activeRegion={region}
        isLoggedIn={isLoggedIn}
        initialInWishlist={initialInWishlist}
      >
        <ProductDescriptionSections secondaryGallery={secondaryGallery} description={description} />
        <ProductReviews
          productId={product.databaseId}
          reviews={reviews?.nodes}
          pageInfo={reviews?.pageInfo}
          averageRating={averageRating ?? 0}
          reviewCount={reviewCount}
          isLoggedIn={isLoggedIn}
          isStaff={isStaff}
        />
      </ProductPageClient>
    </main>
  );
}