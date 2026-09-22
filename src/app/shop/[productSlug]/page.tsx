import { notFound, permanentRedirect } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import { SEO_REGION, selectSeoCategory } from "@/lib/seo/site";

type Props = { params: Promise<{ productSlug: string }> };

export default async function LegacyShopProductPage({ params }: Props) {
  const { productSlug } = await params;
  const product = await getProductDetail(productSlug, SEO_REGION);
  if (!product) notFound();

  const categorySlug = selectSeoCategory(product.productCategories?.nodes)?.slug;
  if (!categorySlug) permanentRedirect(`/${SEO_REGION}`);
  permanentRedirect(`/${SEO_REGION}/${categorySlug}/${product.slug}`);
}
