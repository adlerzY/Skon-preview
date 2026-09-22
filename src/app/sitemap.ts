import type { MetadataRoute } from "next";
import { getSeoSitemapData } from "@/lib/graphql";
import { absoluteUrl, SEO_REGION, selectSeoCategory } from "@/lib/seo/site";

export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSeoSitemapData();
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl(`/${SEO_REGION}`) },
    { url: absoluteUrl(`/${SEO_REGION}/blog`) },
    { url: absoluteUrl(`/${SEO_REGION}/download`) },
    { url: absoluteUrl(`/${SEO_REGION}/support`) },
  ];

  for (const category of data.productCategories) {
    entries.push({ url: absoluteUrl(`/${SEO_REGION}/${category.slug}`) });
  }

  for (const product of data.products) {
    const categorySlug = selectSeoCategory(product.categories)?.slug;
    if (!categorySlug) continue;
    entries.push({ url: absoluteUrl(`/${SEO_REGION}/${categorySlug}/${product.slug}`) });
  }

  for (const category of data.blogCategories) {
    entries.push({ url: absoluteUrl(`/${SEO_REGION}/blog/${category.slug}`) });
  }

  for (const post of data.blogPosts) {
    const category = post.categories[0];
    if (!category) continue;
    const categorySlug = category.parent?.slug || category.slug;
    entries.push({
      url: absoluteUrl(`/${SEO_REGION}/blog/${categorySlug}/${post.slug}`),
      lastModified: post.modified ? new Date(post.modified) : post.date ? new Date(post.date) : undefined,
    });
  }

  return entries;
}
