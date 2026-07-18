import "server-only";
import { fetchGraphQL } from "./client";
import { formatProducts, sanitizeHtml } from "./utils";
import { resolveAvatarUrl } from "@/lib/avatars";
import { HeaderCategoryNode, HeroTabItem, ProductNode } from "./types";
import {
  CATEGORY_BASIC_FIELDS,
  PRODUCT_CARD_FIELDS,
  BANNER_FIELDS,
  HERO_TAB_FIELDS,
} from "./fragments";

interface Banner {
  title: string;
  secondimage: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

function safeBannerUrls(banners: Banner[]): Banner[] {
  return banners.map((b) => ({
    ...b,
    imageUrl: b.imageUrl ? encodeURI(b.imageUrl) : "",
    secondimage: b.secondimage ? encodeURI(b.secondimage) : "",
  }));
}

function safeHeroTabUrls(tabs: HeroTabItem[]): HeroTabItem[] {
  return tabs.map((t) => ({
    ...t,
    imageUrl: t.imageUrl ? encodeURI(t.imageUrl) : "",
  }));
}

export async function getHeaderCategories() {
  const data = await fetchGraphQL(
    `
      ${CATEGORY_BASIC_FIELDS}
      query GetHeaderCategories {
        productCategories(where: { hideEmpty: true, parent: 0 }, first: 15) {
          nodes { ...CategoryBasicFields }
        }
      }
    `,
    {},
    ["header-data"]
  );

  const nodes: HeaderCategoryNode[] = data?.productCategories?.nodes ?? [];
  return nodes
    .filter((cat) => !["home", "uncategorized"].includes(cat.slug) && cat.image?.sourceUrl)
    .map((cat) => ({
      title: cat.name,
      img: cat.image!.sourceUrl,
      link: `/${cat.slug}`,
    }));
}

export async function getProducts(categorySlug?: string, activeRegion: string = "eu") {
  const tags = categorySlug ? ["products", `category-${categorySlug}`] : ["products"];
  const data = await fetchGraphQL(
    `
      ${PRODUCT_CARD_FIELDS}
      query GetProducts($categoryIn: [String], $regionSlug: String) {
        products(first: 12, where: { categoryIn: $categoryIn, status: "PUBLISH", regionSlug: $regionSlug }) {
          nodes { ...ProductCardFields }
        }
      }
    `,
    categorySlug ? { categoryIn: [categorySlug], regionSlug: activeRegion } : { regionSlug: activeRegion },
    tags
  );

  return formatProducts(data?.products?.nodes ?? [], true, activeRegion).filter(
    (p) => p.isAvailableInRegion !== false
  );
}

export async function getProductsByIds(ids: number[], activeRegion: string = "eu"): Promise<ProductNode[]> {
  if (!ids || ids.length === 0) return [];

  const data = await fetchGraphQL(
    `
      ${PRODUCT_CARD_FIELDS}
      query GetProductsByIds($include: [Int]) {
        products(first: 100, where: { include: $include, status: "PUBLISH" }) {
          nodes { ...ProductCardFields }
        }
      }
    `,
    { include: ids },
    [],
    "no-store"
  );

  return formatProducts(data?.products?.nodes ?? [], true, activeRegion);
}

export async function getCategoryArchive(slug: string, activeRegion: string = "eu") {
  if (!slug) return null;

  const [categoryData, bannersData] = await Promise.all([
    fetchGraphQL(
      `
        ${CATEGORY_BASIC_FIELDS}
        ${PRODUCT_CARD_FIELDS}
        query GetCategoryProducts($id: ID!, $categoryIn: [String], $regionSlug: String) {
          productCategory(id: $id, idType: SLUG) {
            ...CategoryBasicFields
            children(where: { hideEmpty: true }) {
              nodes { id databaseId name slug }
            }
          }
          products(first: 100, where: { categoryIn: $categoryIn, status: "PUBLISH", regionSlug: $regionSlug }) {
            nodes { ...ProductCardFields }
          }
        }
      `,
      { id: slug, categoryIn: [slug], regionSlug: activeRegion },
      ["products", `category-${slug}`]
    ),
    fetchGraphQL(
      `
        ${BANNER_FIELDS}
        query GetCategoryBanners($id: ID!) {
          productCategory(id: $id, idType: SLUG) {
            banners { ...BannerFields }
          }
        }
      `,
      { id: slug },
      ["banners", `banners-${slug}`]
    ),
  ]);

  if (!categoryData?.productCategory) return null;

  return {
    ...categoryData.productCategory,
    banners: safeBannerUrls(bannersData?.productCategory?.banners ?? []),
    products: {
      nodes: formatProducts(categoryData.products?.nodes ?? [], true, activeRegion).filter(
        (p) => p.isAvailableInRegion !== false
      ),
    },
  };
}

export async function getHomePageData(activeRegion: string = "eu") {
  const data = await fetchGraphQL(
    `
      ${PRODUCT_CARD_FIELDS}
      ${BANNER_FIELDS}
      ${HERO_TAB_FIELDS}
      query GetHomePage($regionSlug: String) {
        homeBanners: productCategory(id: "home", idType: SLUG) {
          banners { ...BannerFields }
          heroTabs { ...HeroTabFields }
        }
        featuredProducts: products(first: 12, where: { featured: true, status: "PUBLISH", regionSlug: $regionSlug }) {
          nodes { ...ProductCardFields }
        }
        latestProducts: products(first: 10, where: { status: "PUBLISH", orderby: { field: DATE, order: DESC }, regionSlug: $regionSlug }) {
          nodes { ...ProductCardFields }
        }
      }
    `,
    { regionSlug: activeRegion },
    ["products", "banners", "home"],
    "force-cache"
  );

  if (!data) {
    return { banners: [], heroTabs: [] as HeroTabItem[], featured: [] as ProductNode[], latest: [] as ProductNode[] };
  }

  return {
    banners: safeBannerUrls(data.homeBanners?.banners ?? []),
    heroTabs: safeHeroTabUrls(data.homeBanners?.heroTabs ?? []),
    featured: formatProducts(data.featuredProducts?.nodes ?? [], true, activeRegion).filter(
      (p) => p.isAvailableInRegion !== false
    ),
    latest: formatProducts(data.latestProducts?.nodes ?? [], true, activeRegion).filter(
      (p) => p.isAvailableInRegion !== false
    ),
  };
}

export async function getHeaderBlogCategories() {
  const data = await fetchGraphQL(
    `
      query GetBlogCategories {
        categories(where: { hideEmpty: true, parent: 0 }, first: 15) {
          nodes {
            name
            slug
            categoryImage { sourceUrl(size: "thumbnail") }
          }
        }
      }
    `,
    {},
    ["header-data"]
  );

  const nodes: HeaderCategoryNode[] = data?.categories?.nodes ?? [];
  return nodes
    .filter((cat) => cat.categoryImage?.sourceUrl)
    .map((cat) => ({
      title: cat.name,
      img: cat.categoryImage!.sourceUrl,
      link: `/blog/${cat.slug}/`,
    }));
}

export async function getPostDetail(slug: string) {
  if (!slug) return null;

  const data = await fetchGraphQL(
    `
      query GetPostDetail($id: ID!) {
        post(id: $id, idType: SLUG) {
          title
          content
          date
          featuredImage { node { sourceUrl(size: LARGE) } }
          categories { nodes { name slug } }
          author { node { name } }
        }
      }
    `,
    { id: slug },
    [`post-${slug}`]
  );

  if (!data?.post) return null;

  return {
    ...data.post,
    content: sanitizeHtml(data.post.content) ?? "",
  };
}

export async function getProductDetail(slug: string, activeRegion: string = "eu") {
  if (!slug) return null;

  const data = await fetchGraphQL(
    `
      ${PRODUCT_CARD_FIELDS}
      query GetProductDetail($id: ID!) {
        product(id: $id, idType: SLUG) {
          ...ProductCardFields
          imageLarge: image { sourceUrl(size: LARGE) }
          description
          secondaryGallery { description imageUrl }
          galleryImages { nodes { sourceUrl(size: LARGE) } }
          attributes { nodes { name options } }
          averageRating
          reviewCount
          reviews(first: 20) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              databaseId
              parentDatabaseId
              isStaffReply
              content
              date
              author {
                node {
                  name
                  ... on User {
                    avatarUrl
                  }
                }
              }
            }
          }
        }
      }
    `,
    { id: slug },
    [`product-${slug}`]
  );

  if (!data?.product) return null;
  const formatted = formatProducts([data.product], false, activeRegion);
  const product = formatted[0] ?? null;
  if (!product) return null;

  if (product.reviews?.nodes && Array.isArray(product.reviews.nodes)) {
    product.reviews.nodes = await Promise.all(
      product.reviews.nodes.map(async (r: any) => {
        const authorNode = r.author?.node;
        const originalAvatar = authorNode?.avatarUrl || null;

        return {
          ...r,
          author: {
            ...r.author,
            node: {
              ...authorNode,
              avatarUrl: await resolveAvatarUrl(originalAvatar),
            },
          },
        };
      })
    );
  }

  return product;
}

export async function getRegions() {
  const data = await fetchGraphQL(
    `
      query GetRegions {
        allPaRegionShop(first: 10) {
          nodes { name title slug flagUrl }
        }
      }
    `,
    {},
    ["regions"]
  );

  if (!data?.allPaRegionShop?.nodes) {
    console.error("getRegions: no data returned");
    return [];
  }

  return data.allPaRegionShop.nodes.map((r: Record<string, string>) => ({
    name: r.name || r.title,
    slug: r.slug,
    flagUrl: r.flagUrl || undefined,
  }));
}

export async function getBlogCategoryArchive(slug: string) {
  if (!slug) return null;

  const data = await fetchGraphQL(
    `
      query GetBlogCategoryPosts($id: ID!) {
        category(id: $id, idType: SLUG) {
          name
          slug
          posts(first: 20) {
            nodes {
              id title slug date
              featuredImage { node { sourceUrl(size: MEDIUM) } }
              author { node { name } }
            }
          }
        }
      }
    `,
    { id: slug },
    [`blog-category-${slug}`]
  );

  return data?.category ?? null;
}

export async function getAllBlogPosts(options: { search?: string; after?: string } = {}) {
  const { search, after } = options;

  const data = await fetchGraphQL(
    `
      query GetAllBlogPosts($after: String, $search: String) {
        posts(first: 12, after: $after, where: { search: $search }) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id title slug date
            featuredImage { node { sourceUrl(size: MEDIUM) } }
            author { node { name } }
            categories(first: 1) { nodes { slug } }
          }
        }
      }
    `,
    { after, search },
    search ? [] : ["all-blog-posts"],
    search ? "no-store" : "force-cache"
  );

  return {
    posts: data?.posts?.nodes ?? [],
    pageInfo: data?.posts?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}