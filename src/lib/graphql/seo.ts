import "server-only";
import { unstable_cache } from "next/cache";
import { fetchGraphQL } from "./client";

export interface SeoProductIndexItem {
  slug: string;
  categories: Array<{ slug: string; name: string }>;
}

export interface SeoProductCategoryIndexItem {
  slug: string;
  name: string;
  count?: number | null;
}

export interface SeoBlogCategoryIndexItem {
  slug: string;
  name: string;
  count?: number | null;
}

export interface SeoBlogPostIndexItem {
  slug: string;
  date?: string | null;
  modified?: string | null;
  categories: Array<{ slug: string; name: string; parent?: { slug: string; name: string } | null }>;
}

async function loadProductIndex() {
  const items: SeoProductIndexItem[] = [];
  let after: string | null = null;
  let page = 0;

  do {
    const data = await fetchGraphQL(
      `
        query GetSeoProductIndex($after: String) {
          products(first: 100, after: $after, where: { status: "PUBLISH" }) {
            pageInfo { hasNextPage endCursor }
            nodes {
              slug
              ... on Product {
                productCategories(first: 20) {
                  nodes { slug name }
                }
              }
              ... on SimpleProduct {
                productCategories(first: 20) {
                  nodes { slug name }
                }
              }
              ... on VariableProduct {
                productCategories(first: 20) {
                  nodes { slug name }
                }
              }
              ... on ExternalProduct {
                productCategories(first: 20) {
                  nodes { slug name }
                }
              }
              ... on GroupProduct {
                productCategories(first: 20) {
                  nodes { slug name }
                }
              }
            }
          }
        }
      `,
      { after },
      ["seo-sitemap-products"],
      "force-cache"
    );

    if (!data) break;

    for (const product of data.products?.nodes ?? []) {
      if (typeof product?.slug !== "string" || !product.slug) continue;
      const categories = (product.productCategories?.nodes ?? [])
        .filter((category: any) => typeof category?.slug === "string" && category.slug)
        .map((category: any) => ({ slug: category.slug, name: category.name || category.slug }));
      if (categories.length === 0) continue;
      items.push({ slug: product.slug, categories });
    }

    const pageInfo = data.products?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    after = pageInfo.endCursor;
    page += 1;
  } while (page < 100);

  return items;
}

async function loadProductCategoryIndex() {
  const items: SeoProductCategoryIndexItem[] = [];
  let after: string | null = null;
  let page = 0;

  do {
    const data = await fetchGraphQL(
      `
        query GetSeoProductCategoryIndex($after: String) {
          productCategories(first: 100, after: $after, where: { hideEmpty: true }) {
            pageInfo { hasNextPage endCursor }
            nodes { slug name count }
          }
        }
      `,
      { after },
      ["seo-sitemap-categories"],
      "force-cache"
    );

    if (!data) break;

    for (const category of data.productCategories?.nodes ?? []) {
      if (typeof category?.slug !== "string" || !category.slug || ["home", "uncategorized"].includes(category.slug)) continue;
      items.push({ slug: category.slug, name: category.name || category.slug, count: category.count ?? null });
    }

    const pageInfo = data.productCategories?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    after = pageInfo.endCursor;
    page += 1;
  } while (page < 100);

  return items;
}

async function loadBlogCategoryIndex() {
  const items: SeoBlogCategoryIndexItem[] = [];
  let after: string | null = null;
  let page = 0;

  do {
    const data = await fetchGraphQL(
      `
        query GetSeoBlogCategoryIndex($after: String) {
          categories(first: 100, after: $after, where: { hideEmpty: true }) {
            pageInfo { hasNextPage endCursor }
            nodes { slug name count }
          }
        }
      `,
      { after },
      ["seo-sitemap-blog-categories"],
      "force-cache"
    );

    if (!data) break;

    for (const category of data.categories?.nodes ?? []) {
      if (typeof category?.slug !== "string" || !category.slug || category.slug === "uncategorized") continue;
      items.push({ slug: category.slug, name: category.name || category.slug, count: category.count ?? null });
    }

    const pageInfo = data.categories?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    after = pageInfo.endCursor;
    page += 1;
  } while (page < 100);

  return items;
}

async function loadBlogPostIndex() {
  const items: SeoBlogPostIndexItem[] = [];
  let after: string | null = null;
  let page = 0;

  do {
    const data = await fetchGraphQL(
      `
        query GetSeoBlogPostIndex($after: String) {
          posts(first: 100, after: $after, where: { status: PUBLISH }) {
            pageInfo { hasNextPage endCursor }
            nodes {
              slug
              date
              modified
              categories(first: 1) {
                nodes {
                  slug
                  name
                  parent { node { slug name } }
                }
              }
            }
          }
        }
      `,
      { after },
      ["seo-sitemap-posts"],
      "force-cache"
    );

    if (!data) break;

    for (const post of data.posts?.nodes ?? []) {
      if (typeof post?.slug !== "string" || !post.slug) continue;
      const categories = (post.categories?.nodes ?? [])
        .filter((category: any) => typeof category?.slug === "string" && category.slug)
        .map((category: any) => ({
          slug: category.slug,
          name: category.name || category.slug,
          parent: category.parent?.node?.slug
            ? { slug: category.parent.node.slug, name: category.parent.node.name || category.parent.node.slug }
            : null,
        }));
      if (categories.length === 0) continue;
      items.push({ slug: post.slug, date: post.date ?? null, modified: post.modified ?? null, categories });
    }

    const pageInfo = data.posts?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    after = pageInfo.endCursor;
    page += 1;
  } while (page < 100);

  return items;
}

export async function getSeoSitemapData() {
  const cached = unstable_cache(
    async () => {
      const [products, productCategories, blogCategories, blogPosts] = await Promise.all([
        loadProductIndex(),
        loadProductCategoryIndex(),
        loadBlogCategoryIndex(),
        loadBlogPostIndex(),
      ]);

      return { products, productCategories, blogCategories, blogPosts };
    },
    ["seo-sitemap-data"],
    { tags: ["seo-sitemap"], revalidate: 1800 }
  );

  return cached();
}
