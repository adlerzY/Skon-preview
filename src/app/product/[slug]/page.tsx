import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryShell, getProductDetail } from "@/lib/graphql";
import { SEO_REGION, selectSeoCategory } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export default async function LegacyProductRoute({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryShell(slug);

  if (category) {
    permanentRedirect(`/${SEO_REGION}/${category.slug}`);
  }

  const product = await getProductDetail(slug, SEO_REGION);
  if (!product) notFound();

  const categorySlug = selectSeoCategory(product.productCategories?.nodes)?.slug;
  if (!categorySlug) permanentRedirect(`/${SEO_REGION}`);
  permanentRedirect(`/${SEO_REGION}/${categorySlug}/${product.slug}`);
}
